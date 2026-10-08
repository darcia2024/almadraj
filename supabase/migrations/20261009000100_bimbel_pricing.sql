-- Bimbel pricing from the owner, plus the single Lughah Arabiyyah Tingkat 4 maddah.
-- Requires 20261006000100_bimbel_bundles and 20261006000200_seed_bimbel_maddah.
-- Only prices are set here; courses stay draft until PJ / links are filled and published.
-- Idempotent: safe to run more than once.

-- 1. Every maddah (non-bundle Bimbel course): Rp 95.000
update public.courses
set price = 95000, updated_at = now()
where program_type = 'Bimbel'
  and is_bundle = false
  and slug like 'bimbel-%';

-- 2. Bundles per fakultas + tingkat
update public.courses as c
set price = p.price, updated_at = now()
from (values
  ('bimbel-syariah-tingkat-1-paket-lengkap', 360000),
  ('bimbel-syariah-tingkat-2-paket-lengkap', 360000),
  ('bimbel-syariah-tingkat-3-paket-lengkap', 455000),
  ('bimbel-syariah-tingkat-4-paket-lengkap', 360000),
  ('bimbel-ushuluddin-tingkat-1-paket-lengkap', 550000),
  ('bimbel-ushuluddin-tingkat-2-paket-lengkap', 550000)
) as p(slug, price)
where c.slug = p.slug;

-- 3. Lughah Arabiyyah Tingkat 4: one maddah, no bundle
insert into public.courses (
  slug, title, program_type, faculty, summary, tutor, schedule, duration,
  price, is_published, media_format, has_certificate, tingkat, is_bundle
)
values (
  'bimbel-lughah-arabiyyah-tingkat-4-tarikh-adab-arabi-hadis',
  'Tarikh Adab Arabi Hadis · Lughah Arabiyyah Tingkat 4',
  'Bimbel',
  'Lughah Arabiyyah',
  'Bimbel imtihan maddah Tarikh Adab Arabi Hadis untuk Fakultas Lughah Arabiyyah Tingkat 4 sesuai muqarrar Al-Azhar. Termasuk rekaman pembahasan, grup WhatsApp, dan PDF muqorror.',
  'Al-Madraj Edu',
  'Akses kapan saja',
  'Rekaman pembahasan',
  95000,
  false,
  'video',
  true,
  4,
  false
)
on conflict (slug) do update
  set price = excluded.price, updated_at = now();

-- Check: maddah count and price per fakultas / tingkat
select faculty, tingkat, is_bundle, count(*) as jumlah, min(price) as harga
from public.courses
where program_type = 'Bimbel'
group by faculty, tingkat, is_bundle
order by faculty, tingkat, is_bundle desc;
