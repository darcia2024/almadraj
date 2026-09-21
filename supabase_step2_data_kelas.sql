-- This migration is idempotent: course rows are upserted and lessons are added only once.

insert into public.courses (
  slug,
  title,
  program_type,
  faculty,
  summary,
  tutor,
  schedule,
  duration,
  price,
  is_published
)
values
  (
    'kajian-fikih-matan-abi-syuja',
    'Kajian Fikih Matan Abi Syuja',
    'Dars',
    'Syariah',
    'Kajian fikih Matan Abi Syuja dengan pembahasan bertahap yang bisa diikuti kembali sesuai ritme belajar.',
    'Al-Madraj Edu',
    'Akses kapan saja',
    '25 pertemuan',
    200000,
    true
  ),
  (
    'kajian-aqidah-ithaf-al-murid',
    'Kajian Aqidah Ithaf al-Murid',
    'Dars',
    'Ushuluddin',
    'Kajian aqidah berbasis kitab Ithaf al-Murid untuk membantu pembelajar memahami materi secara runtut.',
    'Al-Madraj Edu',
    'Akses kapan saja',
    '24 pertemuan',
    240000,
    true
  ),
  (
    'kajian-tajwid-online',
    'Kajian Tajwid Online',
    'Dars',
    'Lughah Arabiyyah',
    'Kajian tajwid online yang dapat diakses gratis untuk membantu memperbaiki bacaan secara bertahap.',
    'Al-Madraj Edu',
    'Akses kapan saja',
    '3 pertemuan',
    0,
    true
  ),
  (
    'kajian-risalah-al-adudiyah',
    'Kajian Risalah al-''Adudiyah',
    'Dars',
    'Ushuluddin',
    'Kajian gratis Risalah al-''Adudiyah untuk membuka akses pembelajaran ilmu Islam berbasis turats.',
    'Al-Madraj Edu',
    'Akses kapan saja',
    '3 pertemuan',
    0,
    true
  ),
  (
    'kitab-hujjah-ahli-sunah-wal-jamaah',
    'Kitab Hujjah Ahli Sunah wal Jama''ah',
    'Dars',
    'Ushuluddin',
    'Kajian gratis Kitab Hujjah Ahli Sunah wal Jama''ah dengan akses video yang bisa dipelajari kembali.',
    'Al-Madraj Edu',
    'Akses kapan saja',
    '6 pertemuan',
    0,
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  program_type = excluded.program_type,
  faculty = excluded.faculty,
  summary = excluded.summary,
  tutor = excluded.tutor,
  schedule = excluded.schedule,
  duration = excluded.duration,
  price = excluded.price,
  is_published = excluded.is_published,
  updated_at = now();

with lesson_seed(slug, title, content_url, sort_order) as (
  values
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 01', 'https://youtu.be/LqylY5ovn_8?si=bgbcgUjKlXdKyUfu', 1),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 02', 'https://youtu.be/V-2adEO-hGg?si=hjG703QgfIzCiGYm', 2),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 03', 'https://youtu.be/_Fc86zNl0q4?si=Y24V8dnQs-8pz65X', 3),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 04', 'https://youtu.be/Wn0Z1rVmjaQ?si=BtkIEGKU7sy2_X5j', 4),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 05', 'https://youtu.be/HiebLgYZDOQ?si=UFha4LZ5W0mW3JF3', 5),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 06', 'https://youtu.be/19K5nbumSbg?si=1FysRLlrmSYGm3Eb', 6),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 07', 'https://youtu.be/d76T_1WV_mU?si=b9pfqLiEb46U2E5c', 7),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 08', 'https://youtu.be/IA8WG3tFGbQ?si=Lm1GrTolOI2a38nP', 8),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 09', 'https://youtu.be/uNgG_XUMbNg?si=tLJF1EpBWlezYaqw', 9),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 10', 'https://youtu.be/XeUsGMhI68A?si=iHCRqloACF9u-RXE', 10),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 11', 'https://youtu.be/3z4BZ6HTPPs?si=yPT-kXVhYho6Dl_3', 11),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 12', 'https://youtu.be/j2ndt415wSU?si=Net0KzmMxv9CqfvX', 12),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 13', 'https://youtu.be/0phO_rNI3Sk?si=S54xx81TU_eVi1w2', 13),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 14', 'https://youtu.be/SMp4aQm5hEc?si=HbTVkuoCmxVqh2QD', 14),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 15', 'https://youtu.be/GzB3kt3QbC8?si=hO-6T5n_OZkBO6mu', 15),
    ('kajian-fikih-matan-abi-syuja', 'Pertemuan 16', 'https://youtu.be/jcQYEQ6VoGY?si=M-fY0d9aQ22Segr4', 16),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 01', 'https://youtu.be/Wjn2_aLLiIU?si=13xagW2skGhPZrsz', 1),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 02', 'https://youtu.be/a5PY_Js1dC4?si=nslhfSeV3BA105Yi', 2),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 03', 'https://youtu.be/x_g9I54hhnc?si=7Yap5fjU2T_KBgF5', 3),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 04', 'https://youtu.be/s4rZchc7XgU?si=xzCVynHduaPQuD7h', 4),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 05', 'https://youtu.be/hRB9fay1wZk?si=jNqRQ8dttQk_lzcR', 5),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 06', 'https://youtu.be/W6Bka5L3NjE?si=33eSx7Fi3LgoSPFa', 6),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 07', 'https://youtu.be/TytM8PC6_5k?si=ys6rc-fDJMc1ILQK', 7),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 08', 'https://youtu.be/0FDIspeqdJk?si=ZAavfbxHPHm183ZS', 8),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 09', 'https://youtu.be/e-MtRnEM82s?si=9y0wDZypZq-PO3SJ', 9),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 10', 'https://youtu.be/THdI8zq3zBU?si=OQyi2FIBs6bGClfF', 10),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 11', 'https://youtu.be/CKVppMr0p6w?si=koEOMyZiyXNh-Xad', 11),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 12', 'https://youtu.be/nW3xM97Q4OE?si=SuvdnoHOeJHhOki3', 12),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 13', 'https://youtu.be/MHmbzyhWhKg?si=7sKIqVNijMFybPU2', 13),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 14', 'https://youtu.be/vyl4JF8ju6M?si=rSApgLrMDHgQhA91', 14),
    ('kajian-aqidah-ithaf-al-murid', 'Pertemuan 15', 'https://youtu.be/6y83OdHbzX4?si=aY6phkzep2P0Lr14', 15),
    ('kajian-tajwid-online', 'Pertemuan 01', 'https://youtu.be/BrFTpmC-Or0?si=O-COLdECFTtvM4Xd', 1),
    ('kajian-tajwid-online', 'Pertemuan 02', 'https://youtu.be/C7vvg8Q_TE0?si=dh5onlhqaXyO70KL', 2),
    ('kajian-tajwid-online', 'Pertemuan 03', 'https://youtu.be/mQ3wpX2k70g?si=ZRyrjMnF-YZuc0Q4', 3),
    ('kajian-risalah-al-adudiyah', 'Pertemuan 01', 'https://youtu.be/G1xHqUYSN2g?si=1BV-bMzkNZPZsjEK', 1),
    ('kajian-risalah-al-adudiyah', 'Pertemuan 02', 'https://youtu.be/iXoJwiBappc?si=K4rPLRuDk4fTDKi', 2),
    ('kajian-risalah-al-adudiyah', 'Pertemuan 03', 'https://youtu.be/17xarGaNIwI?si=BkvblLLfx4fE2tiY', 3),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 01', 'https://youtu.be/gzgxAqNviH0?si=Cu-Ru-BfgtPmGXyL', 1),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 02', 'https://youtu.be/xWXqI4pVQ0g?si=oHj5g8To5CUlh_67', 2),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 03', 'https://youtu.be/CnS6dgz_iss?si=bySJOYN2BjJ5kKnN', 3),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 04', 'https://youtu.be/7Wo53bQEZ0k?si=OtBq1FeYjYNv9xtV', 4),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 05', 'https://youtu.be/jyHE8N61yH0?si=qRtyjHJy9onEHq_I', 5),
    ('kitab-hujjah-ahli-sunah-wal-jamaah', 'Pertemuan 06', 'https://youtu.be/YCMqc1v1oBo?si=4mBdXaq2csSxDefe', 6)
)
insert into public.lessons (course_id, title, content_type, duration, content_url, sort_order, is_published)
select c.id, lesson.title, 'video', '', lesson.content_url, lesson.sort_order, true
from lesson_seed lesson
join public.courses c on c.slug = lesson.slug
where not exists (
  select 1
  from public.lessons existing
  where existing.course_id = c.id
    and existing.content_url = lesson.content_url
);

create or replace function public.enroll_lms_free_course(p_course_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses;
  v_enrollment public.enrollments;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_course
  from public.courses
  where slug = p_course_slug
    and is_published = true
    and price = 0;

  if not found then
    raise exception 'FREE_COURSE_NOT_FOUND';
  end if;

  insert into public.enrollments (user_id, course_id, status, activated_at)
  values (auth.uid(), v_course.id, 'active', now())
  on conflict (user_id, course_id) do update set
    status = 'active',
    activated_at = coalesce(public.enrollments.activated_at, now())
  returning * into v_enrollment;

  return v_enrollment.id;
end;
$$;

revoke all on function public.enroll_lms_free_course(text) from public;
grant execute on function public.enroll_lms_free_course(text) to authenticated;

-- Keep only the five programs supplied by Al-Madraj.
-- Orders and enrollments reference courses with RESTRICT, so remove those rows first.
begin;

delete from public.orders
where course_id in (
  select id from public.courses where slug not in (
    'kajian-fikih-matan-abi-syuja',
    'kajian-aqidah-ithaf-al-murid',
    'kajian-tajwid-online',
    'kajian-risalah-al-adudiyah',
    'kitab-hujjah-ahli-sunah-wal-jamaah'
  )
);

delete from public.enrollments
where course_id in (
  select id from public.courses where slug not in (
    'kajian-fikih-matan-abi-syuja',
    'kajian-aqidah-ithaf-al-murid',
    'kajian-tajwid-online',
    'kajian-risalah-al-adudiyah',
    'kitab-hujjah-ahli-sunah-wal-jamaah'
  )
);

delete from public.courses
where slug not in (
  'kajian-fikih-matan-abi-syuja',
  'kajian-aqidah-ithaf-al-murid',
  'kajian-tajwid-online',
  'kajian-risalah-al-adudiyah',
  'kitab-hujjah-ahli-sunah-wal-jamaah'