-- Migration: Set daru.fahma@gmail.com as Master Admin
-- Project: Al Madraj LMS

-- 1. Ensure is_lms_admin function checks both profile role and master admin email
create or replace function public.is_lms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and (p.role = 'admin' or lower(coalesce(u.email, '')) = 'daru.fahma@gmail.com')
  ) or exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(coalesce(email, '')) = 'daru.fahma@gmail.com'
  );
$$;

create or replace function public.is_lms_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join auth.users u on u.id = p.id
    where p.id = p_user_id
      and (p.role = 'admin' or lower(coalesce(u.email, '')) = 'daru.fahma@gmail.com')
  ) or exists (
    select 1
    from auth.users
    where id = p_user_id
      and lower(coalesce(email, '')) = 'daru.fahma@gmail.com'
  );
$$;

grant execute on function public.is_lms_admin() to authenticated, anon;
grant execute on function public.is_lms_admin(uuid) to authenticated, anon;

-- 2. Update existing profile record if daru.fahma@gmail.com already registered
update public.profiles
set role = 'admin', updated_at = now()
where id in (
  select id from auth.users where lower(email) = 'daru.fahma@gmail.com'
);

-- 3. Update handle_lms_user trigger so daru.fahma@gmail.com is registered as admin automatically
create or replace function public.handle_lms_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.lms_role := 'student';
begin
  if lower(coalesce(new.email, '')) = 'daru.fahma@gmail.com' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, whatsapp, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'whatsapp', ''),
    v_role
  )
  on conflict (id) do update set
    role = case
      when lower(coalesce(new.email, '')) = 'daru.fahma@gmail.com' then 'admin'
      else profiles.role
    end,
    full_name = case
      when profiles.full_name = '' then coalesce(new.raw_user_meta_data ->> 'full_name', profiles.full_name)
      else profiles.full_name
    end;
  return new;
end;
$$;

-- 4. Enable admin management policy on profiles so admins can assign PJ / co-admins
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles
for all to authenticated
using (public.is_lms_admin())
with check (public.is_lms_admin());
