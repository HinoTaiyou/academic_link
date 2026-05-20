-- Migration: add search function using pg_trgm similarity for research_posts

create extension if not exists pg_trgm;

create or replace function public.search_research_posts(
  _q text,
  _limit int,
  _offset int
)
returns table(
  id uuid,
  author_id uuid,
  project_id uuid,
  created_at timestamptz,
  title text,
  summary text,
  tags text[],
  raw_text text,
  file_name text,
  pdf_path text,
  score double precision
)
language sql stable
as $$
  select
    rp.id,
    rp.author_id,
    rp.project_id,
    rp.created_at,
    rp.title,
    rp.summary,
    rp.tags,
    rp.raw_text,
    rp.file_name,
    rp.pdf_path,
    greatest(similarity(rp.title, _q), similarity(rp.summary, _q), similarity(rp.raw_text, _q)) as score
  from public.research_posts rp
  where (
    rp.title ilike ('%' || _q || '%')
    or rp.summary ilike ('%' || _q || '%')
    or similarity(rp.title, _q) > 0.02
    or similarity(rp.summary, _q) > 0.02
    or similarity(rp.raw_text, _q) > 0.02
  )
  order by score desc, rp.created_at desc
  limit _limit offset _offset;
$$;

-- Optionally create indexes (already added in previous migration)
