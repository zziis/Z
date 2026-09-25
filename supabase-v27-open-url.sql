-- Taj Al Muluk V27
-- Run once in Supabase SQL Editor to enable the optional direct-open URL.

alter table public.platform_content
  add column if not exists open_url text;

comment on column public.platform_content.open_url is
  'Optional HTTPS/deep-link URL used by the public Open Direct button. Downloads still use r2_object/download_url.';
