-- 1) Peserta yang membayar di luar web/Mayar (mis. transfer dari Malaysia) ditambahkan
--    manual oleh admin; kolom ini menandai asal enrollment + catatan pembayarannya.
-- 2) Syarat pendaftaran: bukti share pamflet (story IG/WhatsApp) dan bukti follow IG.
--
-- Idempotent: aman dijalankan berulang.

alter table public.enrollments add column if not exists source text not null default 'mayar';
alter table public.enrollments add column if not exists payment_note text not null default '';

create table if not exists public.registration_proofs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  share_story_path text not null default '',
  follow_ig_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registration_proofs enable row level security;

drop policy if exists registration_proofs_self_select on public.registration_proofs;
create policy registration_proofs_self_select on public.registration_proofs
  for select to authenticated using (user_id = auth.uid() or public.is_lms_admin());

drop policy if exists registration_proofs_self_insert on public.registration_proofs;
create policy registration_proofs_self_insert on public.registration_proofs
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists registration_proofs_self_update on public.registration_proofs;
create policy registration_proofs_self_update on public.registration_proofs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists registration_proofs_admin_write on public.registration_proofs;
create policy registration_proofs_admin_write on public.registration_proofs
  for all to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

grant select, insert, update, delete on public.registration_proofs to authenticated;

-- Bucket privat; file disimpan di <user_id>/<jenis>.<ext>
insert into storage.buckets (id, name, public)
values ('registration-proofs', 'registration-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists registration_proofs_owner_write on storage.objects;
create policy registration_proofs_owner_write on storage.objects
  for all to authenticated
  using (bucket_id = 'registration-proofs' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'registration-proofs' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists registration_proofs_admin_read on storage.objects;
create policy registration_proofs_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'registration-proofs' and public.is_lms_admin());

notify pgrst, 'reload schema';
