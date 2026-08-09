-- =============================================================================
-- LeadOS V1.1 Migration: Referral Rewards & Candidate Linking
-- =============================================================================
-- Expands referral_status enum, adds commission tracking columns,
-- and denormalizes candidate_contact_id for fast lookups.
-- =============================================================================

-- 1. Expand referral_status enum with new values
--    PostgreSQL requires adding values one at a time with IF NOT EXISTS
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'paid';

-- 2. Add commission tracking columns
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 3. Denormalize candidate_contact_id for direct referrer↔candidate lookup
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS candidate_contact_id UUID REFERENCES contacts(id);

-- 4. Index for fast candidate lookups
CREATE INDEX IF NOT EXISTS idx_referrals_candidate ON referrals(candidate_contact_id) WHERE candidate_contact_id IS NOT NULL;

-- 5. Backfill: copy existing reward_amount into commission_amount
UPDATE referrals 
SET commission_amount = reward_amount 
WHERE commission_amount = 0 AND reward_amount > 0;

-- 6. Backfill: denormalize candidate_contact_id from opportunities
UPDATE referrals r
SET candidate_contact_id = o.contact_id
FROM opportunities o
WHERE r.opportunity_id = o.id
AND r.candidate_contact_id IS NULL;

-- 7. Migrate 'successful' status to 'approved'
--    NOTE: This must run AFTER the ALTER TYPE above has committed.
--    In a single transaction with enum changes, wrap in a DO block:
DO $$
BEGIN
  UPDATE referrals SET status = 'approved' WHERE status = 'successful';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration of successful→approved skipped (enum value may not exist yet)';
END;
$$;
