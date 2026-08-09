-- Add is_archived column to contacts
alter table contacts
add column if not exists is_archived boolean default false;

-- Add index for filtering
create index if not exists contacts_is_archived_idx on contacts(is_archived);
