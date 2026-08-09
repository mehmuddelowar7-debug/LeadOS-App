-- Create candidate_documents bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'candidate_documents', 'candidate_documents', true
where not exists (
  select 1 from storage.buckets where id = 'candidate_documents'
);

-- Policy to allow authenticated users to view documents
create policy "Users can view candidate documents"
  on storage.objects for select
  using ( bucket_id = 'candidate_documents' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users to upload documents
create policy "Users can upload candidate documents"
  on storage.objects for insert
  with check ( bucket_id = 'candidate_documents' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update their own documents
create policy "Users can update candidate documents"
  on storage.objects for update
  using ( bucket_id = 'candidate_documents' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users to delete documents
create policy "Users can delete candidate documents"
  on storage.objects for delete
  using ( bucket_id = 'candidate_documents' and auth.role() = 'authenticated' );
