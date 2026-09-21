-- Classify courses as Dars (study sessions) or Bimbel (intensive tutoring).
alter table public.courses add column if not exists program_type text;

update public.courses
set program_type = 'Dars'
where program_type is null or trim(program_type) = '';

alter table public.courses alter column program_type set default 'Dars';
alter table public.courses alter column program_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_program_type_check'
  ) then
    alter table public.courses
      add constraint courses_program_type_check
      check (program_type in ('Dars', 'Bimbel'));
  end if;
end $$;

create index if not exists courses_program_type_idx on public.courses(program_type);
