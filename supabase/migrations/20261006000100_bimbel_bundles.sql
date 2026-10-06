-- Bimbel maddah pricing: buy one maddah, or a bundle covering every maddah of a
-- fakultas + tingkat. A bundle is an ordinary course row (is_bundle = true), so the
-- existing order / Mayar checkout / webhook flow works for it unchanged; activating a
-- bundle enrollment grants every member maddah through a trigger.
--
-- Also adds private per-course links (WhatsApp group, PDF muqorror) that only students
-- with active access, PJ, and admins can read.
--
-- Idempotent: safe to run more than once.

-- 1. Course columns --------------------------------------------------------------

alter table public.courses add column if not exists tingkat smallint;
alter table public.courses add column if not exists is_bundle boolean not null default false;

do $$ begin
  alter table public.courses
    add constraint courses_tingkat_check check (tingkat is null or tingkat between 1 and 6);
exception when duplicate_object then null; end $$;

create index if not exists courses_bimbel_group_idx
  on public.courses (faculty, tingkat)
  where program_type = 'Bimbel';

-- 2. Bundle membership ------------------------------------------------------------
-- Members: every non-bundle Bimbel course with the same faculty and tingkat.

create or replace function public.lms_bundle_member_ids(p_bundle_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id
  from public.courses b
  join public.courses m
    on m.program_type = 'Bimbel'
   and m.is_bundle = false
   and m.faculty = b.faculty
   and m.tingkat = b.tingkat
  where b.id = p_bundle_id
    and b.is_bundle = true
    and b.tingkat is not null;
$$;

revoke all on function public.lms_bundle_member_ids(uuid) from public, anon, authenticated;

-- When a bundle enrollment becomes active (Mayar webhook, admin, or manual), activate
-- every member maddah for that student.
create or replace function public.activate_lms_bundle_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active'
     and (tg_op = 'INSERT' or old.status is distinct from 'active')
     and exists (select 1 from public.courses c where c.id = new.course_id and c.is_bundle) then
    insert into public.enrollments (user_id, course_id, status, activated_at)
    select new.user_id, member_id, 'active', now()
    from public.lms_bundle_member_ids(new.course_id) as member_id
    on conflict (user_id, course_id) do update
      set status = 'active',
          activated_at = coalesce(public.enrollments.activated_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_activate_bundle_members on public.enrollments;
create trigger enrollments_activate_bundle_members
  after insert or update of status on public.enrollments
  for each row execute function public.activate_lms_bundle_members();

-- A maddah added (or moved into a fakultas/tingkat) after students bought the bundle is
-- granted to them too.
create or replace function public.grant_lms_maddah_to_bundle_holders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.program_type = 'Bimbel' and not new.is_bundle and new.tingkat is not null then
    insert into public.enrollments (user_id, course_id, status, activated_at)
    select distinct e.user_id, new.id, 'active', now()
    from public.enrollments e
    join public.courses b on b.id = e.course_id
    where e.status = 'active'
      and b.is_bundle
      and b.program_type = 'Bimbel'
      and b.faculty = new.faculty
      and b.tingkat = new.tingkat
    on conflict (user_id, course_id) do update
      set status = 'active',
          activated_at = coalesce(public.enrollments.activated_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists courses_grant_maddah_to_bundle_holders on public.courses;
create trigger courses_grant_maddah_to_bundle_holders
  after insert or update of program_type, faculty, tingkat, is_bundle on public.courses
  for each row execute function public.grant_lms_maddah_to_bundle_holders();

-- 3. Private access links -----------------------------------------------------------
-- Kept out of public.courses because published course rows are readable by anyone.

create table if not exists public.course_access_links (
  course_id uuid primary key references public.courses(id) on delete cascade,
  whatsapp_group_url text not null default '',
  muqorror_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.course_access_links enable row level security;

drop policy if exists course_access_links_enrolled_select on public.course_access_links;
create policy course_access_links_enrolled_select on public.course_access_links
  for select to authenticated
  using (
    public.is_lms_admin()
    or exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid()
        and e.course_id = course_access_links.course_id
        and e.status = 'active'
    )
    or exists (
      select 1 from public.courses c
      where c.id = course_access_links.course_id
        and c.pj_email <> ''
        and lower(c.pj_email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists course_access_links_admin_write on public.course_access_links;
create policy course_access_links_admin_write on public.course_access_links
  for all to authenticated
  using (public.is_lms_admin())
  with check (public.is_lms_admin());

grant select, insert, update, delete on public.course_access_links to authenticated;

notify pgrst, 'reload schema';
