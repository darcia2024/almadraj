grant usage on schema public to anon, authenticated;
grant select on public.courses, public.lessons to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.enrollments, public.orders to authenticated;
grant insert, update, delete on public.courses, public.lessons, public.enrollments to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant execute on function public.is_lms_admin() to authenticated;
grant execute on function public.create_lms_order(text) to authenticated;
grant execute on function public.mark_lms_order_paid(text, text) to service_role;
