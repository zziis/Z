-- V15 Developer Control Center hotfix
-- Run once in Supabase SQL Editor.
update public.profiles set role='developer' where user_number=1;

create table if not exists public.platform_sections (
 section_key text primary key, title text not null, enabled boolean not null default true,
 sort_order integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.platform_content (
 id uuid primary key default gen_random_uuid(), name text not null,
 content_type text not null check (content_type in ('app','game')), version text,
 description text, image_url text, download_url text, published boolean not null default true,
 created_at timestamptz not null default now()
);
insert into public.platform_sections(section_key,title,sort_order) values
('home','الرئيسية',1),('buy-code','شراء كود',2),('activate-code','تفعيل كود',3),('download-store','تحميل المتجر',4),('apps','التطبيقات',5),('games','الألعاب',6),('cloud-games','الألعاب السحابية',7),('links','الروابط',8),('emulators','المحاكي',9),('paid-games','الألعاب المدفوعة',10),('settings','الإعدادات',11)
on conflict(section_key) do nothing;

alter table public.platform_sections enable row level security;
alter table public.platform_content enable row level security;
create or replace function public.is_developer() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='developer' and user_number=1);
$$;
drop policy if exists "sections read" on public.platform_sections;
create policy "sections read" on public.platform_sections for select using (true);
drop policy if exists "sections developer write" on public.platform_sections;
create policy "sections developer write" on public.platform_sections for all using (public.is_developer()) with check (public.is_developer());
drop policy if exists "content public read" on public.platform_content;
create policy "content public read" on public.platform_content for select using (published or public.is_developer());
drop policy if exists "content developer write" on public.platform_content;
create policy "content developer write" on public.platform_content for all using (public.is_developer()) with check (public.is_developer());
