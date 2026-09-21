drop policy if exists audit_admin_insert on public.admin_audit_logs;
create policy audit_admin_insert on public.admin_audit_logs for insert to authenticated with check (public.is_lms_admin());
grant select, insert on public.admin_audit_logs to authenticated;
