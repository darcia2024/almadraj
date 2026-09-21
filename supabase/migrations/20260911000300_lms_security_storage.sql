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
create policy lessons_enrolled_select on public.lessons for select to authenticated using (public.is_lms_admin() or exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.course_id = lessons.course_id and e.status = 'active'));
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

insert into storage.buckets (id, name, public) values ('lms-materials', 'lms-materials', false) on conflict (id) do update set public = false;
drop policy if exists lms_materials_admin_write on storage.objects;
create policy lms_materials_admin_write on storage.objects for all to authenticated using (bucket_id = 'lms-materials' and public.is_lms_admin()) with check (bucket_id = 'lms-materials' and public.is_lms_admin());
drop policy if exists lms_materials_enrolled_read on storage.objects;
create policy lms_materials_enrolled_read on storage.objects for select to authenticated using (bucket_id = 'lms-materials' and (public.is_lms_admin() or (split_part(name, '/', 1) ~ '^[0-9a-f-]{36}$' and exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.status = 'active' and e.course_id = split_part(name, '/', 1)::uuid))));
