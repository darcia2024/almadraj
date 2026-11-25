-- Folder rekaman Ulumul Quran · Ushuluddin Tingkat 2 (sebelumnya belum tersambung:
-- link lama ternyata folder Syubhat Haula Hadits). Idempotent.
insert into public.course_access_links (course_id, drive_folder_id)
select c.id, '18sTENXYxS4YHl9pIsu6NUZowpY19ZDOZ'
from public.courses c
where c.slug = 'bimbel-ushuluddin-tingkat-2-ulumul-quran'
on conflict (course_id) do update
  set drive_folder_id = excluded.drive_folder_id,
      updated_at = now();

-- Format rekaman Bimbel: semua maddah berupa rekaman suara, kecuali Mawarits (video).
-- Paket Syariah Tingkat 3 memuat Mawarits, jadi formatnya campuran.
update public.courses
set media_format = case
    when slug = 'bimbel-syariah-tingkat-3-mawarits' then 'video'
    when slug = 'bimbel-syariah-tingkat-3-paket-lengkap' then 'hybrid'
    else 'audio'
  end,
  updated_at = now()
where program_type = 'Bimbel'
  and media_format is distinct from (case
    when slug = 'bimbel-syariah-tingkat-3-mawarits' then 'video'
    when slug = 'bimbel-syariah-tingkat-3-paket-lengkap' then 'hybrid'
    else 'audio'
  end);

-- Cek: format rekaman dan folder tiap kelas Bimbel
select c.faculty, c.tingkat, c.title, c.media_format,
  c.is_bundle or coalesce(l.drive_folder_id, '') <> '' as punya_folder
from public.courses c
left join public.course_access_links l on l.course_id = c.id
where c.program_type = 'Bimbel'
order by c.faculty, c.tingkat, c.is_bundle desc, c.title;
