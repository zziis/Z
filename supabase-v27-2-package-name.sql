-- Taj Al Molook V27.2
-- Run once in Supabase SQL Editor.
-- Stores the Android package name used by the Open button after APK installation.

alter table public.platform_content
  add column if not exists package_name text;

comment on column public.platform_content.package_name is
  'Android applicationId/package name, e.g. com.company.game. Used to launch an already installed APK.';
