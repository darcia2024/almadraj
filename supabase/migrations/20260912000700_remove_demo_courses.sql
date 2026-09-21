-- Keep only the five programs supplied by Al-Madraj.
-- Orders and enrollments reference courses with RESTRICT, so remove those rows first.

begin;

do $$
begin
  if (
    select count(*)
    from public.courses
    where slug in (
      'kajian-fikih-matan-abi-syuja',
      'kajian-aqidah-ithaf-al-murid',
      'kajian-tajwid-online',
      'kajian-risalah-al-adudiyah',
      'kitab-hujjah-ahli-sunah-wal-jamaah'
    )
  ) <> 5 then
    raise exception 'Lima program Al-Madraj belum tersedia. Jalankan 20260912000600_seed_dars_programs.sql terlebih dahulu.';
  end if;
end $$;

delete from public.orders
where course_id in (
  select id
  from public.courses
  where slug not in (
    'kajian-fikih-matan-abi-syuja',
    'kajian-aqidah-ithaf-al-murid',
    'kajian-tajwid-online',
    'kajian-risalah-al-adudiyah',
    'kitab-hujjah-ahli-sunah-wal-jamaah'
  )
);

delete from public.enrollments
where course_id in (
  select id
  from public.courses
  where slug not in (
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
);

commit;
