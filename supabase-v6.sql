-- تاج الملوك V6 — متجر الأكواد بالنقاط
-- شغّل V5 أولاً ثم هذا الملف مرة واحدة في Supabase SQL Editor.

alter table public.profiles add column if not exists points bigint not null default 0 check(points >= 0);
alter table public.subscription_codes add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.subscription_codes add column if not exists product_id uuid;

create table if not exists public.code_products(
 id uuid primary key default gen_random_uuid(),
 title text not null,
 code_type text not null check(code_type in('trial','basic')),
 duration_minutes int not null check(duration_minutes > 0),
 points_price bigint not null check(points_price >= 0),
 enabled boolean not null default true,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);

create table if not exists public.point_transactions(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 amount bigint not null,
 kind text not null,
 note text,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);

create table if not exists public.code_purchases(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.code_products(id),
 code_id uuid not null references public.subscription_codes(id),
 points_paid bigint not null,
 created_at timestamptz not null default now()
);

alter table public.code_products enable row level security;
alter table public.point_transactions enable row level security;
alter table public.code_purchases enable row level security;

drop policy if exists products_read on public.code_products;
create policy products_read on public.code_products for select to authenticated using(enabled or public.is_admin());
drop policy if exists products_admin on public.code_products;
create policy products_admin on public.code_products for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists tx_self on public.point_transactions;
create policy tx_self on public.point_transactions for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists purchases_self on public.code_purchases;
create policy purchases_self on public.code_purchases for select to authenticated using(user_id=auth.uid() or public.is_admin());

-- شراء بطاقة كود بالنقاط. السعر والرصيد يُقرآن من قاعدة البيانات ولا يرسلهما المتصفح.
create or replace function public.buy_code_product(p_product uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare p public.code_products; bal bigint; new_code text; cid uuid;
begin
 if auth.uid() is null then raise exception 'login required'; end if;
 if exists(select 1 from profiles where id=auth.uid() and account_status<>'active') then
   return jsonb_build_object('ok',false,'message','الحساب غير متاح للشراء حالياً');
 end if;
 select * into p from code_products where id=p_product and enabled=true for share;
 if not found then return jsonb_build_object('ok',false,'message','البطاقة غير متاحة'); end if;
 select points into bal from profiles where id=auth.uid() for update;
 if coalesce(bal,0) < p.points_price then return jsonb_build_object('ok',false,'message','رصيد النقاط غير كافٍ','points',coalesce(bal,0)); end if;
 update profiles set points=points-p.points_price where id=auth.uid();
 insert into point_transactions(user_id,amount,kind,note,created_by)
 values(auth.uid(),-p.points_price,'purchase','شراء '||p.title,auth.uid());
 new_code='TAJ-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12));
 insert into subscription_codes(code,code_type,duration_minutes,created_by,owner_id,product_id)
 values(new_code,p.code_type,p.duration_minutes,p.created_by,auth.uid(),p.id) returning id into cid;
 insert into code_purchases(user_id,product_id,code_id,points_paid) values(auth.uid(),p.id,cid,p.points_price);
 return jsonb_build_object('ok',true,'message','تم شراء الكود','code',new_code,'points',bal-p.points_price,'duration_minutes',p.duration_minutes,'code_type',p.code_type);
end $$;

-- V6: الكود المشتَرى لا يستطيع حساب آخر تفعيله.
create or replace function public.activate_subscription_code(p_code text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare c subscription_codes; existing subscription_codes;
begin
 if auth.uid() is null then raise exception 'login required'; end if;
 select * into existing from subscription_codes where used_by=auth.uid() and expires_at>now() and not disabled limit 1;
 if found then return jsonb_build_object('ok',false,'message','يوجد كود مفعّل بالفعل'); end if;
 select * into c from subscription_codes where upper(code)=upper(trim(p_code)) for update;
 if not found or c.disabled or c.used_by is not null then return jsonb_build_object('ok',false,'message','الكود غير صالح أو مستخدم'); end if;
 if c.owner_id is not null and c.owner_id<>auth.uid() then return jsonb_build_object('ok',false,'message','هذا الكود مخصص لحساب آخر'); end if;
 update subscription_codes set used_by=auth.uid(),owner_id=coalesce(owner_id,auth.uid()),activated_at=now(),expires_at=now()+make_interval(mins=>c.duration_minutes) where id=c.id;
 update profiles set code_status='مفعّل' where id=auth.uid();
 return jsonb_build_object('ok',true,'message','تم تفعيل الكود','expires_at',now()+make_interval(mins=>c.duration_minutes));
end $$;

create or replace function public.admin_create_code_product(p_title text,p_type text,p_duration_minutes int,p_points_price bigint) returns uuid
language plpgsql security definer set search_path=public as $$ declare x uuid; begin
 if not is_admin() then raise exception 'admin only'; end if;
 if p_type not in('trial','basic') or p_duration_minutes<1 or p_points_price<0 or length(trim(p_title))<2 then raise exception 'invalid'; end if;
 insert into code_products(title,code_type,duration_minutes,points_price,created_by) values(trim(p_title),p_type,p_duration_minutes,p_points_price,auth.uid()) returning id into x;
 return x;
end $$;

create or replace function public.admin_set_product_enabled(p_product uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path=public as $$ begin if not is_admin() then raise exception 'admin only'; end if; update code_products set enabled=p_enabled where id=p_product; end $$;

create or replace function public.admin_adjust_points(p_user uuid,p_amount bigint,p_note text default null) returns bigint
language plpgsql security definer set search_path=public as $$ declare b bigint; begin
 if not is_admin() then raise exception 'admin only'; end if;
 if p_amount=0 then raise exception 'amount cannot be zero'; end if;
 update profiles set points=points+p_amount where id=p_user and points+p_amount>=0 returning points into b;
 if not found then raise exception 'invalid user or insufficient balance'; end if;
 insert into point_transactions(user_id,amount,kind,note,created_by) values(p_user,p_amount,'admin_adjust',coalesce(p_note,'تعديل رصيد من المطور'),auth.uid());
 return b;
end $$;

grant execute on function public.buy_code_product(uuid) to authenticated;
grant execute on function public.admin_create_code_product(text,text,int,bigint) to authenticated;
grant execute on function public.admin_set_product_enabled(uuid,boolean) to authenticated;
grant execute on function public.admin_adjust_points(uuid,bigint,text) to authenticated;
