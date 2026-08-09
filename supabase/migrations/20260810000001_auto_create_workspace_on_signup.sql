-- =============================================================================
-- LeadOS — Migration: Auto-create workspace on user signup
-- File: supabase/migrations/20260810000001_auto_create_workspace_on_signup.sql
--
-- ROOT CAUSE:
--   The schema had no mechanism to create a workspace or workspace_members
--   record when a user signed up. get_user_workspaces() returned {} for
--   every user, causing all contacts INSERT attempts to fail with 42501.
--
-- FIX:
--   Part 1 — Trigger: auto-creates workspace + membership on signup.
--   Part 2 — Backfill: repairs existing users who signed up before this fix.
--   Part 3 — Verify: confirms all users now have membership.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1: Trigger — fires on every new user signup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
  workspace_slug   TEXT;
BEGIN
  workspace_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'))
                    || '-' || substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO public.workspaces (id, name, slug, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || '''s Workspace'),
    workspace_slug,
    now(),
    now()
  )
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, created_at)
  VALUES (new_workspace_id, NEW.id, 'owner', now());

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('workspace_id', new_workspace_id)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2: Backfill — repair every existing user who has no workspace
-- Safe to run multiple times (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  user_rec         RECORD;
  new_workspace_id UUID;
  workspace_slug   TEXT;
BEGIN
  FOR user_rec IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = u.id
    )
  LOOP
    workspace_slug := lower(regexp_replace(split_part(user_rec.email, '@', 1), '[^a-z0-9]', '-', 'g'))
                      || '-' || substr(gen_random_uuid()::text, 1, 8);

    INSERT INTO public.workspaces (id, name, slug, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      split_part(user_rec.email, '@', 1) || '''s Workspace',
      workspace_slug,
      now(),
      now()
    )
    RETURNING id INTO new_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, created_at)
    VALUES (new_workspace_id, user_rec.id, 'owner', now());

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('workspace_id', new_workspace_id)
    WHERE id = user_rec.id;

    RAISE NOTICE 'Backfilled workspace % (slug: %) for user %', new_workspace_id, workspace_slug, user_rec.email;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3: Verify — every user should now have exactly 1 workspace
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  u.email,
  wm.workspace_id,
  w.slug,
  wm.role,
  u.raw_user_meta_data->>'workspace_id' AS jwt_workspace_id,
  CASE
    WHEN wm.workspace_id IS NULL THEN 'STILL MISSING'
    WHEN (u.raw_user_meta_data->>'workspace_id')::uuid = wm.workspace_id THEN 'OK - JWT matches DB'
    ELSE 'JWT mismatch - user must re-login'
  END AS status
FROM auth.users u
LEFT JOIN workspace_members wm ON wm.user_id = u.id
LEFT JOIN workspaces w ON w.id = wm.workspace_id
ORDER BY u.created_at;
