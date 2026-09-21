-- Al Madraj LMS production schema.
-- Run this file in the dedicated LMS Supabase project, not the legacy barber project.

create extension if not exists pgcrypto;

do $$ begin
  create type public.lms_role as enum ('student', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  whatsapp text not null default '',
  role public.lms_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  program_type text not null default 'Dars' check (program_type in ('Dars', 'Bimbel')),
  faculty text not null,
  summary text not null default '',
  tutor text not null default '',
  schedule text not null default '',
  duration text not null default '',
  price integer not null check (price >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content_type text not null check (content_type in ('video', 'pdf', 'text')),
  duration text not null default '',
  content_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  amount integer not null check (amount >= 0),
  status public.order_status not null default 'pending',
  provider text not null default 'mayar',
  provider_checkout_id text,
  provider_payment_id text,
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed_at timestamptz,
  last_watched_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress add column if not exists watched_seconds integer not null default 0;
alter table public.lesson_progress add column if not exists duration_seconds integer not null default 0;
alter table public.lesson_progress add column if not exists last_watched_at timestamptz not null default now();
alter table public.lesson_progress alter column completed_at drop not null;

create index if not exists courses_published_idx on public.courses(is_published);
create index if not exists courses_program_type_idx on public.courses(program_type);
create index if not exists lessons_course_idx on public.lessons(course_id, sort_order);
create index if not exists enrollments_user_idx on public.enrollments(user_id, status);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);

create or replace function public.is_lms_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.is_lms_admin(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = coalesce(p_user_id, auth.uid()) and role = 'admin') $$;

create or replace function public.handle_lms_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'whatsapp', '')
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_lms_user_created on auth.users;
create trigger on_lms_user_created after insert on auth.users
for each row execute function public.handle_lms_user();

create or replace function public.create_lms_order(p_course_slug text)
returns public.orders language plpgsql security definer set search_path = public
as $$
declare
  v_course public.courses;
  v_enrollment public.enrollments;
  v_order public.orders;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_course from public.courses where slug = p_course_slug and is_published = true;
  if not found then raise exception 'COURSE_NOT_FOUND'; end if;

  insert into public.enrollments (user_id, course_id, status)
  values (auth.uid(), v_course.id, 'pending')
  on conflict (user_id, course_id) do update set status = case when enrollments.status = 'active' then 'active' else 'pending' end
  returning * into v_enrollment;

  if v_enrollment.status = 'active' then raise exception 'ALREADY_ENROLLED'; end if;

  insert into public.orders (user_id, course_id, enrollment_id, amount)
  values (auth.uid(), v_course.id, v_enrollment.id, v_course.price)
  returning * into v_order;
  return v_order;
end $$;

create or replace function public.mark_lms_order_paid(p_provider_checkout_id text, p_provider_payment_id text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where provider_checkout_id = p_provider_checkout_id or provider_payment_id = p_provider_payment_id limit 1;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  update public.orders set status = 'paid', provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id), paid_at = coalesce(paid_at, now()), updated_at = now() where id = v_order.id;
  update public.enrollments set status = 'active', activated_at = coalesce(activated_at, now()) where id = v_order.enrollment_id;
end $$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.orders enable row level security;
alter table public.lesson_progress enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.courses, public.lessons to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.enrollments, public.orders to authenticated;
grant insert, update, delete on public.courses, public.lessons, public.enrollments to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant execute on function public.is_lms_admin() to authenticated;
grant execute on function public.create_lms_order(text) to authenticated;
grant execute on function public.mark_lms_order_paid(text, text) to service_role;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_lms_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

create or replace function public.set_lms_user_role(target_user_id uuid, new_role text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_role public.lms_role;
begin
  if not public.is_lms_admin() then
    raise exception 'Hanya Admin yang berhak mengubah role pengguna.';
  end if;

  if new_role not in ('student', 'admin') then
    raise exception 'Role tidak valid: %', new_role;
  end if;

  v_role := new_role::public.lms_role;

  update public.profiles
  set role = v_role, updated_at = now()
  where id = target_user_id;

  return jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
end;
$$;

grant execute on function public.set_lms_user_role(uuid, text) to authenticated;

drop policy if exists courses_public_select on public.courses;
create policy courses_public_select on public.courses for select to anon, authenticated using (is_published = true or public.is_lms_admin());
drop policy if exists courses_admin_write on public.courses;
create policy courses_admin_write on public.courses for all to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

drop policy if exists lessons_public_select on public.lessons;
create policy lessons_public_select on public.lessons for select to anon, authenticated using ((is_published = true and exists (select 1 from public.courses c where c.id = course_id and c.is_published = true)) or public.is_lms_admin());
drop policy if exists lessons_admin_write on public.lessons;
create policy lessons_admin_write on public.lessons for all to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

drop policy if exists enrollments_self_select on public.enrollments;
create policy enrollments_self_select on public.enrollments for select to authenticated using (user_id = auth.uid() or public.is_lms_admin());
drop policy if exists enrollments_admin_write on public.enrollments;
create policy enrollments_admin_write on public.enrollments for all to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

drop policy if exists orders_self_select on public.orders;
create policy orders_self_select on public.orders for select to authenticated using (user_id = auth.uid() or public.is_lms_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update to authenticated using (public.is_lms_admin()) with check (public.is_lms_admin());

drop policy if exists progress_self_manage on public.lesson_progress;
create policy progress_self_manage on public.lesson_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  order_id uuid references public.orders(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, type, order_id)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists lessons_public_select on public.lessons;
create policy lessons_enrolled_select on public.lessons for select to authenticated
using (
  public.is_lms_admin()
  or exists (
    select 1 from public.enrollments e
    where e.user_id = auth.uid() and e.course_id = lessons.course_id and e.status = 'active'
  )
);

drop policy if exists progress_admin_select on public.lesson_progress;
create policy progress_admin_select on public.lesson_progress for select to authenticated using (public.is_lms_admin() or user_id = auth.uid());
drop policy if exists notifications_self_select on public.notifications;
create policy notifications_self_select on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_lms_admin());
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists audit_admin_select on public.admin_audit_logs;
create policy audit_admin_select on public.admin_audit_logs for select to authenticated using (public.is_lms_admin());
drop policy if exists audit_admin_insert on public.admin_audit_logs;
create policy audit_admin_insert on public.admin_audit_logs for insert to authenticated with check (public.is_lms_admin());

grant select, update on public.notifications to authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

insert into storage.buckets (id, name, public)
values ('lms-materials', 'lms-materials', false)
on conflict (id) do update set public = false;

drop policy if exists lms_materials_admin_write on storage.objects;
create policy lms_materials_admin_write on storage.objects for all to authenticated
using (bucket_id = 'lms-materials' and public.is_lms_admin())
with check (bucket_id = 'lms-materials' and public.is_lms_admin());
drop policy if exists lms_materials_enrolled_read on storage.objects;
create policy lms_materials_enrolled_read on storage.objects for select to authenticated
using (
  bucket_id = 'lms-materials'
  and (
    public.is_lms_admin()
    or (
      split_part(name, '/', 1) ~ '^[0-9a-f-]{36}$'
      and exists (
        select 1 from public.enrollments e
        where e.user_id = auth.uid() and e.status = 'active' and e.course_id = split_part(name, '/', 1)::uuid
      )
    )
  )
);
-- Seed the Dars catalog supplied by Al-Madraj and provide free-course enrollment.
);

-- Production hardening: also available as migration 20260913000100.
alter table public.orders add column if not exists expires_at timestamptz;
alter table public.profiles add column if not exists avatar_path text;

create index if not exists orders_user_course_pending_idx
  on public.orders (user_id, course_id, created_at desc)
  where status = 'pending';

create or replace function public.create_lms_order(p_course_slug text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses;
  v_enrollment public.enrollments;
  v_order public.orders;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_course from public.courses
  where slug = p_course_slug and is_published = true;
  if not found then raise exception 'COURSE_NOT_FOUND'; end if;
  if v_course.price <= 0 then raise exception 'FREE_COURSE_DOES_NOT_REQUIRE_ORDER'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(auth.uid()::text || ':' || v_course.id::text, 0)
  );

  insert into public.enrollments (user_id, course_id, status)
  values (auth.uid(), v_course.id, 'pending')
  on conflict (user_id, course_id) do update set
    status = case when public.enrollments.status = 'active' then 'active' else 'pending' end
  returning * into v_enrollment;

  if v_enrollment.status = 'active' then raise exception 'COURSE_ALREADY_OWNED'; end if;

  update public.orders set status = 'expired', updated_at = now()
  where user_id = auth.uid() and course_id = v_course.id and status = 'pending'
    and expires_at is not null and expires_at <= now();

  select * into v_order from public.orders
  where user_id = auth.uid() and course_id = v_course.id and status = 'pending'
    and (expires_at is null or expires_at > now())
  order by created_at desc limit 1;
  if found then return v_order; end if;

  insert into public.orders (user_id, course_id, enrollment_id, amount, status, expires_at)
  values (auth.uid(), v_course.id, v_enrollment.id, v_course.price, 'pending', now() + interval '1 hour')
  returning * into v_order;
  return v_order;
end;
$$;

create or replace function public.refresh_lms_order_status(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.orders;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_order from public.orders
  where id = p_order_id and (user_id = auth.uid() or public.is_lms_admin(auth.uid()))
  for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'pending' and v_order.expires_at is not null and v_order.expires_at <= now() then
    update public.orders set status = 'expired', updated_at = now()
    where id = v_order.id returning * into v_order;
  end if;
  return v_order;
end;
$$;

revoke all on function public.create_lms_order(text) from PUBLIC, anon;
grant execute on function public.create_lms_order(text) to authenticated;
revoke all on function public.refresh_lms_order_status(uuid) from PUBLIC, anon;
grant execute on function public.refresh_lms_order_status(uuid) to authenticated;
revoke all on function public.mark_lms_order_paid(text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.mark_lms_order_paid(text, text) to service_role;

drop policy if exists progress_self_manage on public.lesson_progress;
create policy progress_self_manage on public.lesson_progress for all to authenticated
using (
  user_id = auth.uid() and exists (
    select 1 from public.lessons l join public.enrollments e
      on e.course_id = l.course_id and e.user_id = auth.uid() and e.status = 'active'
    where l.id = lesson_progress.lesson_id
  )
)
with check (
  user_id = auth.uid() and exists (
    select 1 from public.lessons l join public.enrollments e
      on e.course_id = l.course_id and e.user_id = auth.uid() and e.status = 'active'
    where l.id = lesson_progress.lesson_id
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatar_self_read on storage.objects;
create policy avatar_self_read on storage.objects for select to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatar_self_insert on storage.objects;
create policy avatar_self_insert on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatar_self_update on storage.objects;
create policy avatar_self_update on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatar_self_delete on storage.objects;
create policy avatar_self_delete on storage.objects for delete to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
