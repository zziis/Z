-- Taj Al Molook V9 - account actions + developer role compatibility
-- Run once in Supabase SQL Editor.

alter table public.profiles add column if not exists role text not null default 'user';

create or replace function public.disable_my_account() returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  update public.profiles
     set account_status='restricted'
   where id=auth.uid();
  if not found then raise exception 'profile not found'; end if;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'login required'; end if;
  delete from auth.users where id=v_uid;
  if not found then raise exception 'user not found'; end if;
end $$;

grant execute on function public.disable_my_account() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Developer account stays ID 1.
update public.profiles set role='developer' where user_number=1;

notify pgrst, 'reload schema';
