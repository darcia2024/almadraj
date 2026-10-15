-- Bimbel recordings come straight from a Google Drive folder per maddah.
--
-- PJ uploads each meeting's recording to the maddah's Drive folder; /api/drive/sync turns new
-- files into published audio lessons (when an enrolled student or admin opens the learning
-- room, and once a day via Vercel cron) and notifies enrolled students.
--
-- The folder id is private (course_access_links is readable only by enrolled students, PJ and
-- admins). Idempotent: safe to run more than once.

alter table public.course_access_links
  add column if not exists drive_folder_id text not null default '';

alter table public.lessons
  add column if not exists drive_file_id text;

do $$ begin
  alter table public.lessons
    add constraint lessons_course_drive_file_key unique (course_id, drive_file_id);
exception when duplicate_object or duplicate_table then null; end $$;

-- Folder rekaman per maddah (Ulumul Quran Ushuluddin Tk 2 menyusul: link yang dikirim
-- ternyata folder Syubhat Haula Hadis).
insert into public.course_access_links (course_id, drive_folder_id)
select c.id, f.folder_id
from public.courses c
join (values
  ('bimbel-syariah-tingkat-1-nahwu-sharaf', '1tmA2RmDWlpq5iKMKMj-6b92naIQcxr1n'),
  ('bimbel-syariah-tingkat-1-tafsir-ayat-ahkam', '1l_IU9jFUQiLrRCiOV7THOWpKKFOkwVHp'),
  ('bimbel-syariah-tingkat-1-tarikh-tasyri', '1Ykc_nFwVh-V-Aczvpdwn8auPIMX_ydk3'),
  ('bimbel-syariah-tingkat-1-ulumul-hadis', '1Tdf0wi9eXngJ5_7o5z0WMv6W4dgqOFLW'),
  ('bimbel-syariah-tingkat-2-qadhaya-fiqhiyyah', '1cfl-WOpI-Nnj1No1Gi5Bb-YdC3_XX7iG'),
  ('bimbel-syariah-tingkat-2-tafsir-ayat-ahkam', '1A6_58ELiXI1-IZLU-TlZpQJShqURb2kg'),
  ('bimbel-syariah-tingkat-2-tauhid', '19a-t1ZNdLKspZ6ajVN94nQ0h6jQC61_w'),
  ('bimbel-syariah-tingkat-2-nahwu-sharaf', '1o0-6lwsfqUyOGtJpszggJMEgmAElavVc'),
  ('bimbel-syariah-tingkat-3-balaghah', '1JKSWx4EhWCsxLyRATT7jCAr72i-f5KNz'),
  ('bimbel-syariah-tingkat-3-tafsir-ayat-ahkam', '1kEOD-eaLg9ly-Gyl4YWQ5LdmgF_OMkya'),
  ('bimbel-syariah-tingkat-3-adab', '1qlpZaBitCxjm-M-Oy4BEwjqwMdPJc1FV'),
  ('bimbel-syariah-tingkat-3-mawarits', '1_eJUWRni98s5igkro4mvyR8N8l_AFlA_'),
  ('bimbel-syariah-tingkat-3-manahij-dakwah', '19nRp-B5qooZNwci4jLNfIe6p_AeeRfXu'),
  ('bimbel-syariah-tingkat-4-qawaid-fiqhiyyah', '1funWlvziveLgztkr5HlZ047pG-yJfwBa'),
  ('bimbel-syariah-tingkat-4-tafsir-ayat-ahkam', '19LX7bPAUVMaep86XGJLk_EDTCmvyoyx6'),
  ('bimbel-syariah-tingkat-4-balaghah', '1fi6qEb-TFZ9QRKOxnQiOS_f-7OgF1o5w'),
  ('bimbel-syariah-tingkat-4-adab', '1CFFosT_QjZi98cYdvvm0JlcAA3TN_pWb'),
  ('bimbel-ushuluddin-tingkat-1-mantiq', '1PWteJ0ly55rPcUK-btPjoGg2tup71RRQ'),
  ('bimbel-ushuluddin-tingkat-1-nahwu-sharaf', '1sZCRFy9XEpT9WXEu33t_fQ40ERyS_vaa'),
  ('bimbel-ushuluddin-tingkat-1-ulumul-quran', '1jHVtzzMB1NYsTRsTnZLLzfRqH0jDGUIe'),
  ('bimbel-ushuluddin-tingkat-1-tarikh-sunnah', '11arAs7yfDmAvYjxIhNAbD5rEJI0VKU5W'),
  ('bimbel-ushuluddin-tingkat-1-nuzhum', '1WNqqfoayxl33XXMoNC9xaqGeFpHUNje3'),
  ('bimbel-ushuluddin-tingkat-1-fiqih', '1nrbdOWJUI_3pprOb3FKMdUvxNEDIKqzn'),
  ('bimbel-ushuluddin-tingkat-2-fiqih', '1dWVi5zAMrNrnFzJYa8pPu1Z-jEZPHy8F'),
  ('bimbel-ushuluddin-tingkat-2-khitobah', '1DE0llagVvWak0C8lWRyoGUVac84dix9z'),
  ('bimbel-ushuluddin-tingkat-2-falsafah-ammah', '1iI9KilvCUMlcayWxfzFDAuxqdEZg37fC'),
  ('bimbel-ushuluddin-tingkat-2-syubhat-haula-hadits', '1kexFFql3e0G3xARHg3wCYNve5aFG3hG_'),
  ('bimbel-ushuluddin-tingkat-2-mantiq', '1bJLhlbG5x2LF8z5hP8l_kVJkcbYrWsMz'),
  ('bimbel-lughah-arabiyyah-tingkat-4-tarikh-adab-arabi-hadis', '12hwdxJ240NTtFnW3zEqRwz0WmiFuQX2A')
) as f(slug, folder_id) on f.slug = c.slug
on conflict (course_id) do update
  set drive_folder_id = excluded.drive_folder_id,
      updated_at = now();

-- Rekaman Bimbel berupa audio.
update public.courses c
set media_format = 'audio', updated_at = now()
from public.course_access_links l
where l.course_id = c.id
  and l.drive_folder_id <> ''
  and c.program_type = 'Bimbel'
  and c.media_format is distinct from 'audio';

notify pgrst, 'reload schema';

-- Check: maddah yang sudah punya folder rekaman
select c.faculty, c.tingkat, c.title, l.drive_folder_id <> '' as punya_folder
from public.courses c
left join public.course_access_links l on l.course_id = c.id
where c.program_type = 'Bimbel' and not c.is_bundle
order by c.faculty, c.tingkat, c.title;
