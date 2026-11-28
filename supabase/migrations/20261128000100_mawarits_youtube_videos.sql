-- Video YouTube Mawarits · Syariah Tingkat 3 (pertemuan 1–2). Idempotent: aman dijalankan ulang.
with course as (
  select id from public.courses where slug = 'bimbel-syariah-tingkat-3-mawarits'
), videos(title, url, sort_order) as (
  values
    ('Pertemuan 1 (Video)',             'https://www.youtube.com/watch?v=uTZ8v2sf6Cs', 1),
    ('Pertemuan 2 — Bagian 1 (Video)',  'https://www.youtube.com/watch?v=6q8PFsIR2iA', 2),
    ('Pertemuan 2 — Bagian 2 (Video)',  'https://www.youtube.com/watch?v=C8jjuqp2q4o', 2)
), added as (
  insert into public.lessons (course_id, title, content_type, duration, content_url, sort_order, is_published)
  select course.id, v.title, 'video', '', v.url, v.sort_order, true
  from course cross join videos v
  where not exists (
    select 1 from public.lessons l
    where l.course_id = course.id and l.content_url = v.url
  )
  returning course_id, title
)
-- Beri tahu peserta Mawarits yang aktif bila ada video baru.
insert into public.notifications (user_id, type, title, body)
select e.user_id, 'new_recording', 'Video baru: Mawarits',
  (select string_agg(title, ', ') from added) || ' sudah bisa ditonton.'
from public.enrollments e
where e.status = 'active'
  and e.course_id = (select id from course)
  and exists (select 1 from added);

-- Cek: daftar materi Mawarits
select l.sort_order, l.content_type, l.title, l.content_url
from public.lessons l
join public.courses c on c.id = l.course_id
where c.slug = 'bimbel-syariah-tingkat-3-mawarits' and l.is_published
order by l.sort_order, l.content_type, l.title;
