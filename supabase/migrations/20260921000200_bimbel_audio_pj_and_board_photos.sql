-- Migration for Bimbel Audio, PJ assignment, board photos, modul PDF, and Syahadah
-- Run this in Supabase SQL Editor if columns do not exist yet.

-- 1. Extend courses table
alter table public.courses
  add column if not exists pj_name text default '',
  add column if not exists pj_contact text default '',
  add column if not exists pj_email text default '',
  add column if not exists media_format text default 'audio',
  add column if not exists modul_url text default '',
  add column if not exists has_certificate boolean default true;

-- 2. Extend lessons table: add 'audio' to content_type check and add teacher_notes & board_photos
alter table public.lessons
  drop constraint if exists lessons_content_type_check;

alter table public.lessons
  add constraint lessons_content_type_check
  check (content_type in ('video', 'audio', 'pdf', 'text'));

alter table public.lessons
  add column if not exists teacher_notes text default '',
  add column if not exists board_photos text[] default '{}'::text[];

-- 3. Policy: allow course PJ to update their assigned course lessons
do $do$ begin
  create policy pjs_can_manage_assigned_course_lessons
    on public.lessons
    for all
    to authenticated
    using (
      exists (
        select 1 from public.courses c
        where c.id = lessons.course_id
        and (lower(c.pj_email) = lower(auth.jwt() ->> 'email') or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        ))
      )
    )
    with check (
      exists (
        select 1 from public.courses c
        where c.id = lessons.course_id
        and (lower(c.pj_email) = lower(auth.jwt() ->> 'email') or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        ))
      )
    );
exception when duplicate_object then null;
end $do$;
