-- Ushuluddin Tingkat 2 also has Mantiq (missing from the original poster), making 6 maddah.
-- The bundle trigger grants it automatically to students who already bought the Tk 2 bundle.
-- Idempotent: safe to run more than once.

insert into public.courses (
  slug, title, program_type, faculty, summary, tutor, schedule, duration,
  price, is_published, media_format, has_certificate, tingkat, is_bundle
)
values (
  'bimbel-ushuluddin-tingkat-2-mantiq',
  'Mantiq · Ushuluddin Tingkat 2',
  'Bimbel',
  'Ushuluddin',
  'Bimbel imtihan maddah Mantiq untuk Fakultas Ushuluddin Tingkat 2 sesuai muqarrar Al-Azhar. Termasuk rekaman pembahasan, grup WhatsApp, dan PDF muqorror.',
  'Al-Madraj Edu',
  'Akses kapan saja',
  'Rekaman pembahasan',
  95000,
  false,
  'video',
  true,
  2,
  false
)
on conflict (slug) do nothing;

update public.courses
set duration = '6 maddah',
    summary = 'Paket hemat seluruh maddah Bimbel Fakultas Ushuluddin Tingkat 2: Fiqih, Falsafah Ammah, Syubhat Haula Hadits, Khitobah, Ulumul Quran, Mantiq. Sekali bayar, semua rekaman, grup WhatsApp, dan PDF muqorror tiap maddah langsung terbuka.',
    updated_at = now()
where slug = 'bimbel-ushuluddin-tingkat-2-paket-lengkap';
