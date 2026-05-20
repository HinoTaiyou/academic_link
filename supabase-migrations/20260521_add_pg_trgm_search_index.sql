-- Migration: add pg_trgm extension and trigram GIN indexes for faster search
-- Run this in Supabase SQL Editor or as part of your migration system.

create extension if not exists pg_trgm;

-- Research posts: title + summary + raw_text
create index if not exists research_posts_trgm_idx
  on public.research_posts
  using gin ((coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(raw_text,'')) gin_trgm_ops);

-- Project files: title + summary + raw_text
create index if not exists project_files_trgm_idx
  on public.project_files
  using gin ((coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(raw_text,'')) gin_trgm_ops);

-- Optional: consider adding indexes for profile search (real_name, department)
-- create index if not exists profiles_real_name_trgm_idx
--   on public.profiles
--   using gin ((coalesce(real_name,'') || ' ' || coalesce(department,'')) gin_trgm_ops);
