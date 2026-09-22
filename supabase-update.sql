-- تاج الملوك — تحديث الحساب V7
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor بعد التحديث السابق.

alter table public.profiles add column if not exists public_id bigint;
alter table public.profiles add column if not exists points bigint not null default 0;
alter table public.profiles add column if not exists name_changed_at timestamptz;
alter table public.profiles add column if not exists email_changed_at timestamptz;

create sequence if not exists public.profile_public_id_seq start 1000;
update public.profiles set public_id=nextval('public.profile_public_id_seq') where public_id is null;
alter table public.profiles alter column public_id set default nextval('public.profile_public_id_seq');
create unique index if not exists profiles_public_id_uidx on public.profiles(public_id);

-- مزامنة الاسم القديم من بيانات التسجيل عندما يكون الاسم مأخوذًا من البريد.
update public.profiles p
set display_name = coalesce(nullif(u.raw_user_meta_data->>'display_name',''), p.display_name),
    email = coalesce(u.email,p.email)
from auth.users u
where p.id=u.id
  and nullif(u.raw_user_meta_data->>'display_name','') is not null
  and (p.display_name is null or p.display_name='' or p.display_name=split_part(coalesce(u.email,''),'@',1));

create or replace function public.set_my_display_name(p_name text, p_initial boolean default false)
returns void language plpgsql security definer set search_path=public as $$
declare last_change timestamptz;
begin
 if auth.uid() is null then raise exception 'login required'; end if;
 if length(trim(p_name)) < 2 or length(trim(p_name)) > 40 then raise exception 'الاسم يجب أن يكون بين 2 و40 حرفًا'; end if;
 select name_changed_at into last_change from profiles where id=auth.uid() for update;
 if not p_initial and last_change is not null and last_change > now()-interval '7 days' then raise exception 'لا يمكن تغيير الاسم قبل مرور 7 أيام'; end if;
 update profiles set display_name=trim(p_name), name_changed_at=case when p_initial then name_changed_at else now() end where id=auth.uid();
 update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('display_name',trim(p_name)) where id=auth.uid();
end $$;

-- يمنع تغيير البريد قبل مرور 30 يومًا حتى لو تم استدعاء Auth مباشرة.
create or replace function public.guard_auth_email_change() returns trigger
language plpgsql security definer set search_path=public as $$
declare last_change timestamptz;
begin
 if new.email is distinct from old.email then
   select email_changed_at into last_change from profiles where id=old.id;
   if last_change is not null and last_change > now()-interval '30 days' then raise exception 'لا يمكن تغيير البريد قبل مرور 30 يومًا'; end if;
 end if;
 return new;
end $$;
drop trigger if exists guard_user_email_change on auth.users;
create trigger guard_user_email_change before update of email on auth.users for each row execute function public.guard_auth_email_change();

create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.email is distinct from old.email then update profiles set email=new.email,email_changed_at=now() where id=new.id; end if;
 return new;
end $$;
drop trigger if exists sync_user_email_profile on auth.users;
create trigger sync_user_email_profile after update of email on auth.users for each row execute function public.sync_profile_email();

create or replace function public.disable_my_account() returns void
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'login required'; end if;
 update profiles set account_status='restricted' where id=auth.uid();
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'login required'; end if;
 delete from auth.users where id=uid;
end $$;

grant execute on function public.set_my_display_name(text,boolean) to authenticated;
grant execute on function public.disable_my_account() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
notify pgrst, 'reload schema';
