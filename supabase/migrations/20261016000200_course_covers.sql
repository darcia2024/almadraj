alter table public.courses add column if not exists thumbnail_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-covers', 'course-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists course_covers_public_read on storage.objects;
create policy course_covers_public_read on storage.objects
for select to anon, authenticated using (bucket_id = 'course-covers');

drop policy if exists course_covers_admin_write on storage.objects;
create policy course_covers_admin_write on storage.objects
for all to authenticated
using (bucket_id = 'course-covers' and public.is_lms_admin())
with check (bucket_id = 'course-covers' and public.is_lms_admin());
