-- Add missing enum values for contact_source
-- We use COMMIT before ALTER TYPE since adding a value to an enum cannot be inside a transaction block in some older Postgres versions, 
-- but Supabase supports ADD VALUE IF NOT EXISTS.
ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'meta_lead';
ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'google';
