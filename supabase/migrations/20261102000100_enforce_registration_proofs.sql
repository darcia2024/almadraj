-- Syarat pendaftaran wajib di sisi server: order kelas berbayar baru hanya bisa dibuat
-- bila peserta sudah mengunggah bukti share pamflet dan bukti follow Instagram.
-- Peserta manual (admin) tidak terkena karena tidak membuat order.
--
-- JALANKAN SETELAH frontend yang memuat form syarat ter-deploy. Bila dijalankan lebih
-- dulu, frontend lama tidak punya form sehingga semua checkout berbayar akan gagal.
--
-- Idempotent: aman dijalankan berulang.

create or replace function public.require_registration_proofs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.amount > 0 and not exists (
    select 1 from public.registration_proofs p
    where p.user_id = new.user_id
      and p.share_story_path <> ''
      and p.follow_ig_path <> ''
  ) then
    raise exception 'REGISTRATION_PROOFS_REQUIRED';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_registration_proofs on public.orders;
create trigger orders_require_registration_proofs
  before insert on public.orders
  for each row execute function public.require_registration_proofs();
