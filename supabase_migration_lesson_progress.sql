-- Run this once on an existing Al Madroj LMS database.
alter table public.lesson_progress
  add column if not exists watched_seconds integer not null default 0,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists last_watched_at timestamptz not null default now();

alter table public.lesson_progress
  alter column completed_at drop not null;

alter table public.lesson_progress
  drop constraint if exists lesson_progress_watched_seconds_check,
  drop constraint if exists lesson_progress_duration_seconds_check;

alter table public.lesson_progress
  add constraint lesson_progress_watched_seconds_check check (watched_seconds >= 0),
  add constraint lesson_progress_duration_seconds_check check (duration_seconds >= 0);
