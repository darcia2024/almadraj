delete from public.orders
where course_id in (
  select id from public.courses
  where slug in ('ushul-fiqh', 'musthalah-hadits', 'nahwu-irab')
);

delete from public.enrollments
where course_id in (
  select id from public.courses
  where slug in ('ushul-fiqh', 'musthalah-hadits', 'nahwu-irab')
);

delete from public.courses
where slug in ('ushul-fiqh', 'musthalah-hadits', 'nahwu-irab');
