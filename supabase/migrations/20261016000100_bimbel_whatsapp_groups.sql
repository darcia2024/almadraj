-- Link grup WhatsApp Bimbel, satu grup per maddah (30 maddah: Syari'ah Tk 1-4,
-- Ushuluddin Tk 1-2, Lughah Arabiyyah Tk 4).
--
-- Parameter pelacak dari link undangan (?s=cl&p=a...) dibuang; grupnya tetap sama.
-- Hanya mengisi whatsapp_group_url: folder rekaman dan PDF muqorror tidak disentuh.
-- Idempotent: aman dijalankan ulang.

insert into public.course_access_links (course_id, whatsapp_group_url)
select c.id, w.url
from public.courses c
join (values
  ('bimbel-syariah-tingkat-1-nahwu-sharaf',                     'https://chat.whatsapp.com/GMV674Xa6gE44n79G4XCC3'),
  ('bimbel-syariah-tingkat-1-tafsir-ayat-ahkam',                'https://chat.whatsapp.com/EUngJxR1sekAJy7gTxNBUh'),
  ('bimbel-syariah-tingkat-1-tarikh-tasyri',                    'https://chat.whatsapp.com/L171HCm3pgu277JsmwcCYm'),
  ('bimbel-syariah-tingkat-1-ulumul-hadis',                     'https://chat.whatsapp.com/Id0nZAQ8K4uCNzE0YFuM5s'),
  ('bimbel-syariah-tingkat-2-nahwu-sharaf',                     'https://chat.whatsapp.com/DL1RS3Xfj3l6wqo9xgzgsb'),
  ('bimbel-syariah-tingkat-2-tafsir-ayat-ahkam',                'https://chat.whatsapp.com/Gf22gRm9j7i2Ym97b5TFLe'),
  ('bimbel-syariah-tingkat-2-tauhid',                           'https://chat.whatsapp.com/Kx0ChTnGv5FLUQsbDRMJve'),
  ('bimbel-syariah-tingkat-2-qadhaya-fiqhiyyah',                'https://chat.whatsapp.com/Ihu2cOZ6FV06Kal5qiaUZj'),
  ('bimbel-syariah-tingkat-3-adab',                             'https://chat.whatsapp.com/HUzMCSKeykV65GXX64sL5y'),
  ('bimbel-syariah-tingkat-3-balaghah',                         'https://chat.whatsapp.com/JeAl0KWbWjOCwPjU0GjmOF'),
  ('bimbel-syariah-tingkat-3-mawarits',                         'https://chat.whatsapp.com/LOCRSnoymKc75Idg3vKe8v'),
  ('bimbel-syariah-tingkat-3-manahij-dakwah',                   'https://chat.whatsapp.com/CmFucZuuk4L5lPOR1RTBCz'),
  ('bimbel-syariah-tingkat-3-tafsir-ayat-ahkam',                'https://chat.whatsapp.com/IeGqnV5vzri8jErMZZFFCA'),
  ('bimbel-syariah-tingkat-4-adab',                             'https://chat.whatsapp.com/IcoF3PiWoIdFUR1UTKVEnR'),
  ('bimbel-syariah-tingkat-4-balaghah',                         'https://chat.whatsapp.com/HgJPrClDhDpICn7fjf9GRL'),
  ('bimbel-syariah-tingkat-4-tafsir-ayat-ahkam',                'https://chat.whatsapp.com/FctzWypZNwm2r05ZCUyNfu'),
  ('bimbel-syariah-tingkat-4-qawaid-fiqhiyyah',                 'https://chat.whatsapp.com/FYxbrSreMBJGXF7Po2Za7N'),
  ('bimbel-ushuluddin-tingkat-1-fiqih',                         'https://chat.whatsapp.com/Hw1xj9GMdRaLXxYiHWJNor'),
  ('bimbel-ushuluddin-tingkat-1-nuzhum',                        'https://chat.whatsapp.com/JvQuWzGVwrb1qpf0avoAQA'),
  ('bimbel-ushuluddin-tingkat-1-mantiq',                        'https://chat.whatsapp.com/DNlBvs0GJSrDZDx4hTPUIf'),
  ('bimbel-ushuluddin-tingkat-1-ulumul-quran',                  'https://chat.whatsapp.com/JoXnywuUwhK1CIlBxUk6da'),
  ('bimbel-ushuluddin-tingkat-1-tarikh-sunnah',                 'https://chat.whatsapp.com/JmpQeZnOhvYIskyNb41xH9'),
  ('bimbel-ushuluddin-tingkat-1-nahwu-sharaf',                  'https://chat.whatsapp.com/FgmLpEJUFyeCf3GbPmEkoR'),
  ('bimbel-ushuluddin-tingkat-2-mantiq',                        'https://chat.whatsapp.com/BOP0hS2tAy3GvtkxDP600X'),
  ('bimbel-ushuluddin-tingkat-2-falsafah-ammah',                'https://chat.whatsapp.com/Irhv8dQtRJH2XGvhh5Fpw6'),
  ('bimbel-ushuluddin-tingkat-2-ulumul-quran',                  'https://chat.whatsapp.com/CC1EPCZj2hY1Zj1jgqukQm'),
  ('bimbel-ushuluddin-tingkat-2-syubhat-haula-hadits',          'https://chat.whatsapp.com/E7TGSETBVpZGIsgCvCGgIP'),
  ('bimbel-ushuluddin-tingkat-2-khitobah',                      'https://chat.whatsapp.com/Hp78nDvnuZdFZPSdtuHBLw'),
  ('bimbel-ushuluddin-tingkat-2-fiqih',                         'https://chat.whatsapp.com/KrD5xgaUxX9D8sr5fGS8r9'),
  ('bimbel-lughah-arabiyyah-tingkat-4-tarikh-adab-arabi-hadis', 'https://chat.whatsapp.com/G3dnMe02hLILbP35jCW2ys')
) as w(slug, url) on w.slug = c.slug
on conflict (course_id) do update
  set whatsapp_group_url = excluded.whatsapp_group_url,
      updated_at = now();

-- Check: harus 30 baris dan tidak ada yang "belum ada"
select c.faculty, c.tingkat, c.title,
       coalesce(nullif(l.whatsapp_group_url, ''), '— belum ada —') as grup_whatsapp
from public.courses c
left join public.course_access_links l on l.course_id = c.id
where c.program_type = 'Bimbel' and not c.is_bundle
order by c.faculty, c.tingkat, c.title;
