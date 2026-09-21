-- Migration for selecting PJ based on registered Google accounts
-- Run this in Supabase SQL Editor

-- 1. Ensure profiles has email column
alter table public.profiles
  add column if not exists email text default '';

-- 2. Backfill profiles.email from auth.users
update public.profiles p
set email = lower(u.email)
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- 3. Update handle_lms_user() trigger to save user's email
create or replace function public.handle_lms_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, email, full_name, whatsapp)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'whatsapp', '')
  ) on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    updated_at = now();
  return new;
end $$;

-- 4. Secure RPC function for Admin to retrieve all registered Google users
create or replace function public.get_lms_registered_users()
returns table (
  id uuid,
  email text,
  full_name text,
  whatsapp text,
  role public.lms_role,
  created_at timestamptz
) language plpgsql security definer set search_path = public, auth
as $$
begin
  -- Check if caller is admin or master admin
  if not (
    public.is_lms_admin()
    or lower(auth.jwt() ->> 'email') in (
      'daru.fahma@gmail.com',
      'fahmaadaru@gmail.com',
      'darciatemantaraglobal@gmail.com',
      'almadrajstudy@gmail.com'
    )
  ) then
    raise exception 'Unauthorized: Hanya Admin Master yang dapat melihat daftar pengguna terdaftar.';
  end if;

  return query
  select
    u.id,
    lower(coalesce(u.email, p.email, ''))::text as email,
    coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1)) as full_name,
    coalesce(p.whatsapp, '') as whatsapp,
    coalesce(p.role, 'student'::public.lms_role) as role,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.email is not null and u.email != ''
  order by coalesce(p.full_name, u.email) asc;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_lms_registered_users() to authenticated;
