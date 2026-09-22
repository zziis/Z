-- Taj Al Molook V22 - Dynamic publisher (run once in Supabase SQL Editor)
alter table public.platform_content add column if not exists section_key text not null default 'apps';
alter table public.platform_content add column if not exists r2_object text;
alter table public.platform_content add column if not exists size_text text;

-- Image bucket: APK stays in Cloudflare R2; only cover images are uploaded here.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('content-images','content-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true;

drop policy if exists "content images public read" on storage.objects;
create policy "content images public read" on storage.objects for select using (bucket_id='content-images');
drop policy if exists "developer uploads content images" on storage.objects;
create policy "developer uploads content images" on storage.objects for insert to authenticated
with check (bucket_id='content-images' and public.is_developer());
drop policy if exists "developer updates content images" on storage.objects;
create policy "developer updates content images" on storage.objects for update to authenticated
using (bucket_id='content-images' and public.is_developer()) with check (bucket_id='content-images' and public.is_developer());
drop policy if exists "developer deletes content images" on storage.objects;
create policy "developer deletes content images" on storage.objects for delete to authenticated
using (bucket_id='content-images' and public.is_developer());
