-- Academic Link (tai_zemi_03) schema & RLS
-- Run this in Supabase SQL Editor.

-- Enable extensions (optional but useful)
create extension if not exists "pgcrypto";

-- Profiles: app user metadata linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_name text,
  department text,
  grade text,
  interest_tags text[] not null default '{}',
  research_fields text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Research posts
create table if not exists public.research_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  raw_text text not null default '',
  file_name text,
  pdf_path text
);

-- Research updates (progress log)
create table if not exists public.research_updates (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.research_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  content text not null,
  file_name text,
  raw_text text,
  pdf_path text
);

-- Direct messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Indexes (basic)
create index if not exists research_posts_author_id_idx on public.research_posts(author_id);
create index if not exists messages_pair_idx on public.messages(from_id, to_id, created_at);
create index if not exists messages_to_id_idx on public.messages(to_id, read_at);

-- Storage bucket for PDFs
-- Create in Dashboard: Storage -> New bucket: research-pdfs (private)
-- Then run the storage policies below.

-- Storage policies: research-pdfs
-- Path convention: "<auth.uid()>/<filename>"
drop policy if exists "research_pdfs_select_own" on storage.objects;
create policy "research_pdfs_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "research_pdfs_insert_own" on storage.objects;
create policy "research_pdfs_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "research_pdfs_delete_own" on storage.objects;
create policy "research_pdfs_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS
alter table public.profiles enable row level security;
alter table public.research_posts enable row level security;
alter table public.research_updates enable row level security;
alter table public.messages enable row level security;

-- profiles policies
drop policy if exists "profiles_select_all_authed" on public.profiles;
create policy "profiles_select_all_authed"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- research_posts policies
drop policy if exists "research_posts_select_all_authed" on public.research_posts;
create policy "research_posts_select_all_authed"
on public.research_posts for select
to authenticated
using (true);

drop policy if exists "research_posts_insert_own" on public.research_posts;
create policy "research_posts_insert_own"
on public.research_posts for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "research_posts_update_own" on public.research_posts;
create policy "research_posts_update_own"
on public.research_posts for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "research_posts_delete_own" on public.research_posts;
create policy "research_posts_delete_own"
on public.research_posts for delete
to authenticated
using (auth.uid() = author_id);

-- research_updates policies (must own parent post)
drop policy if exists "research_updates_select_all_authed" on public.research_updates;
create policy "research_updates_select_all_authed"
on public.research_updates for select
to authenticated
using (true);

drop policy if exists "research_updates_insert_own" on public.research_updates;
create policy "research_updates_insert_own"
on public.research_updates for insert
to authenticated
with check (
  exists (
    select 1 from public.research_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

drop policy if exists "research_updates_update_own" on public.research_updates;
create policy "research_updates_update_own"
on public.research_updates for update
to authenticated
using (
  exists (
    select 1 from public.research_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.research_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

drop policy if exists "research_updates_delete_own" on public.research_updates;
create policy "research_updates_delete_own"
on public.research_updates for delete
to authenticated
using (
  exists (
    select 1 from public.research_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

-- messages policies
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages for select
to authenticated
using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "messages_insert_sender_is_authed" on public.messages;
create policy "messages_insert_sender_is_authed"
on public.messages for insert
to authenticated
with check (auth.uid() = from_id);

drop policy if exists "messages_update_participants" on public.messages;
create policy "messages_update_participants"
on public.messages for update
to authenticated
using (auth.uid() = from_id or auth.uid() = to_id)
with check (auth.uid() = from_id or auth.uid() = to_id);

