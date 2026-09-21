-- Harden payment state changes, order creation, learning progress, and avatars.

alter table public.orders
  add column if not exists expires_at timestamptz;

alter table public.profiles
  add column if not exists avatar_path text;

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
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_course
  from public.courses
  where slug = p_course_slug
    and is_published = true;

  if not found then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  if v_course.price <= 0 then
    raise exception 'FREE_COURSE_DOES_NOT_REQUIRE_ORDER';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(auth.uid()::text || ':' || v_course.id::text, 0)
  );

  insert into public.enrollments (user_id, course_id, status)
  values (auth.uid(), v_course.id, 'pending')
  on conflict (user_id, course_id) do update set
    status = case
      when public.enrollments.status = 'active' then 'active'
      else 'pending'
    end
  returning * into v_enrollment;

  if v_enrollment.status = 'active' then
    raise exception 'COURSE_ALREADY_OWNED';
  end if;

  update public.orders
  set status = 'expired', updated_at = now()
  where user_id = auth.uid()
    and course_id = v_course.id
    and status = 'pending'
    and expires_at is not null
    and expires_at <= now();

  select * into v_order
  from public.orders
  where user_id = auth.uid()
    and course_id = v_course.id
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  if found then
    return v_order;
  end if;

  insert into public.orders (
    user_id,
    course_id,
    enrollment_id,
    amount,
    status,
    expires_at
  ) values (
    auth.uid(),
    v_course.id,
    v_enrollment.id,
    v_course.price,
    'pending',
    now() + interval '1 hour'
  )
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
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and (user_id = auth.uid() or public.is_lms_admin(auth.uid()))
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'pending'
    and v_order.expires_at is not null
    and v_order.expires_at <= now() then
    update public.orders
    set status = 'expired', updated_at = now()
    where id = v_order.id
    returning * into v_order;
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_lms_order(text) from PUBLIC, anon;
grant execute on function public.create_lms_order(text) to authenticated;

revoke all on function public.refresh_lms_order_status(uuid) from PUBLIC, anon;
grant execute on function public.refresh_lms_order_status(uuid) to authenticated;

-- Payment activation must only be callable with the server-side service role.
revoke all on function public.mark_lms_order_paid(text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.mark_lms_order_paid(text, text)
  to service_role;

drop policy if exists progress_self_manage on public.lesson_progress;
create policy progress_self_manage on public.lesson_progress
for all to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    join public.enrollments e
      on e.course_id = l.course_id
     and e.user_id = auth.uid()
     and e.status = 'active'
    where l.id = lesson_progress.lesson_id
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.lessons l
    join public.enrollments e
      on e.course_id = l.course_id
     and e.user_id = auth.uid()
     and e.status = 'active'
    where l.id = lesson_progress.lesson_id
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatar_self_read on storage.objects;
create policy avatar_self_read on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatar_self_insert on storage.objects;
create policy avatar_self_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatar_self_update on storage.objects;
create policy avatar_self_update on storage.objects
for update to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatar_self_delete on storage.objects;
create policy avatar_self_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
