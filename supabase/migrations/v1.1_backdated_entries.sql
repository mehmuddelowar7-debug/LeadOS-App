-- =============================================================================
-- LeadOS V1.1 Migration: Backdated Entries
-- =============================================================================
-- Adds explicit date columns so records can be backdated instead of always
-- using NOW(). All columns default to CURRENT_DATE for backward compatibility.
-- =============================================================================

-- Contacts: allow storing the date the contact was actually met/captured
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE;

-- Activities: allow logging activities on a past date
ALTER TABLE contact_activities ADD COLUMN IF NOT EXISTS activity_date DATE DEFAULT CURRENT_DATE;

-- Referrals: allow backdating when the referral actually happened
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_date DATE DEFAULT CURRENT_DATE;

-- Backfill existing rows: set entry_date from created_at
UPDATE contacts SET entry_date = DATE(created_at) WHERE entry_date IS NULL;
UPDATE contact_activities SET activity_date = DATE(created_at) WHERE activity_date IS NULL;
UPDATE referrals SET referral_date = DATE(created_at) WHERE referral_date IS NULL;
