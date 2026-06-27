const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'supabase/schema.sql');
let content = fs.readFileSync(schemaPath, 'utf8');

// Replace Contacts additions
content = content.replace(
  /roles contact_role\[\] DEFAULT '\{candidate\}',/g,
  "roles contact_role[] DEFAULT '{candidate}',\n  labels TEXT[] DEFAULT '{}',"
);

// Replace Referrals additions
content = content.replace(
  /payment_date TIMESTAMPTZ,/g,
  "payment_date TIMESTAMPTZ,\n  payment_reference TEXT,\n  notes TEXT,"
);

// Terminology Refactor: Campaigns -> Opportunity Types
content = content.replace(/campaigns/g, 'opportunity_types');
content = content.replace(/campaign_id/g, 'opportunity_type_id');
content = content.replace(/campaign_type/g, 'program_type');
content = content.replace(/CAMPAIGNS/g, 'OPPORTUNITY TYPES');
content = content.replace(/campaign/g, 'opportunity_type');

// Terminology Refactor: Candidates -> Opportunities
content = content.replace(/candidates/g, 'opportunities');
content = content.replace(/candidate_id/g, 'opportunity_id');
content = content.replace(/candidate_status/g, 'opportunity_status');
content = content.replace(/CANDIDATES/g, 'OPPORTUNITIES');
content = content.replace(/candidate_row/g, 'opportunity_row');
content = content.replace(/calculate_candidate_score/g, 'calculate_opportunity_score');
content = content.replace(/auto_score_candidate/g, 'auto_score_opportunity');
content = content.replace(/candidate/g, 'opportunity');


fs.writeFileSync(schemaPath, content);
console.log('Schema refactored');
