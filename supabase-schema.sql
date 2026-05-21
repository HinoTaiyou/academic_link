-- Academic Link (tai_zemi_03) schema & RLS
-- Run this in Supabase SQL Editor.

-- Enable extensions (optional but useful)
create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

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
  project_id uuid,
  created_at timestamptz not null default now(),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  raw_text text not null default '',
  file_name text,
  pdf_path text
);

-- Add project reference for backward-compatible migration.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'research_posts'
      and column_name = 'project_id'
  ) then
    alter table public.research_posts add column project_id uuid;
  end if;
end;
$$;

-- Project root (user-scoped context)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  description text not null default '',
  system_prompt text not null default '',
  pinned boolean not null default false,
  archived boolean not null default false,
  last_opened_at timestamptz
);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'research_posts_project_id_fkey'
  ) then
    alter table public.research_posts
      add constraint research_posts_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;
end;
$$;

-- Files/documents in each project (PDF, text, image metadata)
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_type text not null default 'pdf' check (source_type in ('pdf', 'text', 'image', 'other')),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  raw_text text not null default '',
  file_name text,
  storage_path text,
  mime_type text,
  figure_notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists project_files_set_updated_at on public.project_files;
create trigger project_files_set_updated_at
before update on public.project_files
for each row
execute function public.set_updated_at();

-- Project conversation logs (context separated by project)
create table if not exists public.project_chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  summary text,
  meta jsonb not null default '{}'::jsonb
);

-- Escalation queue: summarize AI discussion and notify owner/researcher
create table if not exists public.ai_handoffs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sent', 'ack', 'closed')),
  title text not null,
  summary text not null,
  source_chat_ids uuid[] not null default '{}',
  meta jsonb not null default '{}'::jsonb
);

-- Vector chunks partitioned by project/user for retrieval precision
create table if not exists public.project_embeddings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  file_id uuid references public.project_files(id) on delete cascade,
  created_at timestamptz not null default now(),
  chunk_text text not null,
  embedding vector(1536),
  meta jsonb not null default '{}'::jsonb
);

-- Auto-create a default project when a profile row is created.
create or replace function public.handle_new_profile_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.projects (owner_id, name, description)
  values (new.id, 'My First Project', '初回作成されたデフォルトプロジェクト')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_project on public.profiles;
create trigger on_profile_created_project
after insert on public.profiles
for each row execute function public.handle_new_profile_project();

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
create index if not exists research_posts_project_id_idx on public.research_posts(project_id);
create index if not exists projects_owner_id_idx on public.projects(owner_id, pinned, updated_at desc);
create index if not exists project_files_project_id_idx on public.project_files(project_id, created_at desc);
create index if not exists project_files_owner_id_idx on public.project_files(owner_id, created_at desc);
create index if not exists project_chats_project_id_idx on public.project_chats(project_id, created_at desc);
create index if not exists ai_handoffs_project_id_idx on public.ai_handoffs(project_id, created_at desc);
create index if not exists project_embeddings_project_id_idx on public.project_embeddings(project_id);
create index if not exists project_embeddings_owner_id_idx on public.project_embeddings(owner_id);
create index if not exists messages_pair_idx on public.messages(from_id, to_id, created_at);
create index if not exists messages_to_id_idx on public.messages(to_id, read_at);

-- Likes and Bookmarks for research posts / project files
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('research_post','project_file','project')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('research_post','project_file','project','profile')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'likes'
      and constraint_name = 'likes_target_type_check'
  ) then
    alter table public.likes drop constraint likes_target_type_check;
  end if;
  alter table public.likes
    add constraint likes_target_type_check
    check (target_type in ('research_post','project_file','project'));
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'bookmarks'
      and constraint_name = 'bookmarks_target_type_check'
  ) then
    alter table public.bookmarks drop constraint bookmarks_target_type_check;
  end if;
  alter table public.bookmarks
    add constraint bookmarks_target_type_check
    check (target_type in ('research_post','project_file','project','profile'));
end;
$$;

create index if not exists likes_target_idx on public.likes(target_type, target_id);
create index if not exists bookmarks_target_idx on public.bookmarks(target_type, target_id);

alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "likes_select_authed" on public.likes;
create policy "likes_select_authed"
on public.likes for select
to authenticated
using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own"
on public.likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own"
on public.likes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_authed" on public.bookmarks;
create policy "bookmarks_select_authed"
on public.bookmarks for select
to authenticated
using (true);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks for delete
to authenticated
using (auth.uid() = user_id);

-- Storage bucket for PDFs
-- Create in Dashboard: Storage -> New bucket: research-pdfs (private)
-- Then run the storage policies below.

-- Storage policies: research-pdfs
-- ※ storage.objects への ALTER は実行しない（must be owner エラー回避）
-- ※ 詳細・UI手順は supabase/storage-research-pdfs.sql を参照
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

drop policy if exists "research_pdfs_update_own" on storage.objects;
create policy "research_pdfs_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
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
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.project_chats enable row level security;
alter table public.ai_handoffs enable row level security;
alter table public.project_embeddings enable row level security;

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
with check (
  auth.uid() = author_id
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
);

drop policy if exists "research_posts_update_own" on public.research_posts;
create policy "research_posts_update_own"
on public.research_posts for update
to authenticated
using (auth.uid() = author_id)
with check (
  auth.uid() = author_id
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
);

-- projects policies
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "projects_select_authed" on public.projects;
create policy "projects_select_authed"
on public.projects for select
to authenticated
using (archived = false);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects for delete
to authenticated
using (auth.uid() = owner_id);

-- project_files policies
drop policy if exists "project_files_select_own" on public.project_files;
create policy "project_files_select_own"
on public.project_files for select
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_files_select_authed" on public.project_files;
create policy "project_files_select_authed"
on public.project_files for select
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.archived = false
  )
);

drop policy if exists "project_files_insert_own" on public.project_files;
create policy "project_files_insert_own"
on public.project_files for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_files_update_own" on public.project_files;
create policy "project_files_update_own"
on public.project_files for update
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_files_delete_own" on public.project_files;
create policy "project_files_delete_own"
on public.project_files for delete
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

-- project_chats policies
drop policy if exists "project_chats_select_own" on public.project_chats;
create policy "project_chats_select_own"
on public.project_chats for select
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_chats_insert_own" on public.project_chats;
create policy "project_chats_insert_own"
on public.project_chats for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_chats_update_own" on public.project_chats;
create policy "project_chats_update_own"
on public.project_chats for update
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_chats_delete_own" on public.project_chats;
create policy "project_chats_delete_own"
on public.project_chats for delete
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

-- ai_handoffs policies
drop policy if exists "ai_handoffs_select_own" on public.ai_handoffs;
create policy "ai_handoffs_select_own"
on public.ai_handoffs for select
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "ai_handoffs_insert_own" on public.ai_handoffs;
create policy "ai_handoffs_insert_own"
on public.ai_handoffs for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "ai_handoffs_update_own" on public.ai_handoffs;
create policy "ai_handoffs_update_own"
on public.ai_handoffs for update
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "ai_handoffs_delete_own" on public.ai_handoffs;
create policy "ai_handoffs_delete_own"
on public.ai_handoffs for delete
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

-- project_embeddings policies
drop policy if exists "project_embeddings_select_own" on public.project_embeddings;
create policy "project_embeddings_select_own"
on public.project_embeddings for select
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_embeddings_insert_own" on public.project_embeddings;
create policy "project_embeddings_insert_own"
on public.project_embeddings for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_embeddings_update_own" on public.project_embeddings;
create policy "project_embeddings_update_own"
on public.project_embeddings for update
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_embeddings_delete_own" on public.project_embeddings;
create policy "project_embeddings_delete_own"
on public.project_embeddings for delete
to authenticated
using (
  auth.uid() = owner_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

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

-- Enable Realtime for messages (required for live chat)
alter publication supabase_realtime add table public.messages;

