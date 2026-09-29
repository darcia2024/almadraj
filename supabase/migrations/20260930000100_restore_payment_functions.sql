-- Restore the payment pieces that are missing from the production database.
--
-- Production had the LMS tables but not the order/payment functions nor the
-- notifications/audit tables, so "Beli Sekarang" failed with 404 on
-- rpc/create_lms_order and the Mayar webhook could never activate a class.
--
-- Idempotent: safe to run more than once. Existing rows are not touched.

-- 1. Notifications & audit log tables -----------------------------------------

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

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

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

drop policy if exists notifications_self_select on public.notifications;
create policy notifications_self_select on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_lms_admin());
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists audit_admin_select on public.admin_audit_logs;
create policy audit_admin_select on public.admin_audit_logs
  for select to authenticated using (public.is_lms_admin());
drop policy if exists audit_admin_insert on public.admin_audit_logs;
create policy audit_admin_insert on public.admin_audit_logs
  for insert to authenticated with check (public.is_lms_admin());

grant select, update on public.notifications to authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

-- The notification bell listens for new rows in realtime.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object or undefined_object then null; end $$;

-- 2. Order columns used by checkout (no-ops when they already exist) -----------

alter table public.orders add column if not exists expires_at timestamptz;
alter table public.orders add column if not exists provider_checkout_id text;
alter table public.orders add column if not exists provider_payment_id text;
alter table public.orders add column if not exists checkout_url text;
alter table public.orders add column if not exists paid_at timestamptz;

create index if not exists orders_user_course_pending_idx
  on public.orders (user_id, course_id, created_at desc)
  where status = 'pending';

-- 3. Payment functions ----------------------------------------------------------
-- Dropped first so a leftover function with different parameter names cannot
-- block the create (Postgres refuses to rename parameters on replace).

drop function if exists public.create_lms_order(text);
drop function if exists public.refresh_lms_order_status(uuid);
drop function if exists public.mark_lms_order_paid(text, text);

create function public.create_lms_order(p_course_slug text)
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

  insert into public.orders (user_id, course_id, enrollment_id, amount, status, expires_at)
  values (auth.uid(), v_course.id, v_enrollment.id, v_course.price, 'pending', now() + interval '1 hour')
  returning * into v_order;

  return v_order;
end;
$$;

create function public.refresh_lms_order_status(p_order_id uuid)
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
    and (user_id = auth.uid() or public.is_lms_admin())
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

-- Called only by the Mayar webhook (service role). A paid webhook activates the
-- class even if the 1-hour checkout window already marked the order expired.
create function public.mark_lms_order_paid(p_provider_checkout_id text, p_provider_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where (nullif(p_provider_checkout_id, '') is not null and provider_checkout_id = p_provider_checkout_id)
     or (nullif(p_provider_payment_id, '') is not null and provider_payment_id = p_provider_payment_id)
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  update public.orders
  set status = 'paid',
      provider_payment_id = coalesce(nullif(p_provider_payment_id, ''), provider_payment_id),
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where id = v_order.id;

  update public.enrollments
  set status = 'active', activated_at = coalesce(activated_at, now())
  where id = v_order.enrollment_id;
end;
$$;

revoke all on function public.create_lms_order(text) from public, anon;
grant execute on function public.create_lms_order(text) to authenticated;

revoke all on function public.refresh_lms_order_status(uuid) from public, anon;
grant execute on function public.refresh_lms_order_status(uuid) to authenticated;

-- Payment activation must only be callable with the server-side service role.
revoke all on function public.mark_lms_order_paid(text, text) from public, anon, authenticated;
grant execute on function public.mark_lms_order_paid(text, text) to service_role;

-- Make PostgREST pick up the new functions and tables immediately.
notify pgrst, 'reload schema';
