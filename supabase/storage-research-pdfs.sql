-- =============================================================================
-- research-pdfs Storage セットアップ
-- =============================================================================
-- 【必須】先にダッシュボードでバケット作成:
--   Storage → New bucket → 名前: research-pdfs → Public: OFF
--
-- このファイルを SQL Editor で Run（下の ALTER は含めないこと）
-- エラー "must be owner of table objects" が出る場合 → 末尾の「UI で作る手順」を参照
-- =============================================================================

-- ※ storage.objects の ALTER は Supabase では postgres でも失敗することがあるため実行しない
-- ※ RLS はホスト環境では最初から有効です

-- 古いポリシーを削除
drop policy if exists "research_pdfs_select_own" on storage.objects;
drop policy if exists "research_pdfs_select_public_linked" on storage.objects;
drop policy if exists "research_pdfs_insert_own" on storage.objects;
drop policy if exists "research_pdfs_delete_own" on storage.objects;
drop policy if exists "research_pdfs_update_own" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Give users access to own folder" on storage.objects;

-- 読み取り（自分のフォルダ）
create policy "research_pdfs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 読み取り（公開プロジェクト・研究に紐づく他人の PDF）
create policy "research_pdfs_select_public_linked"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (
    exists (
      select 1
      from public.project_files pf
      inner join public.projects p on p.id = pf.project_id
      where pf.storage_path = name
        and p.archived = false
    )
    or exists (
      select 1
      from public.research_posts rp
      where rp.pdf_path = name
    )
  )
);

-- 書き込み（INSERT）※ PDF アップロードに必須
create policy "research_pdfs_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 更新
create policy "research_pdfs_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 削除
create policy "research_pdfs_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================
-- SQL が通らないとき: Storage UI でポリシーを作る（推奨）
-- =============================================================================
-- Storage → research-pdfs → Policies → New policy
--
-- 1) INSERT（アップロード）
--    Policy name: research_pdfs_insert_own
--    Allowed operation: INSERT
--    Target roles: authenticated
--    WITH CHECK expression:
--      (bucket_id = 'research-pdfs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
--
-- 2) SELECT（自分のフォルダ）
--    Policy name: research_pdfs_select_own
--    USING: (bucket_id = 'research-pdfs') AND ((storage.foldername(name))[1] = auth.uid()::text)
--
-- 3) SELECT（公開資料に紐づく PDF）※ 他人の原本表示に必要
--    Policy name: research_pdfs_select_public_linked
--    USING: bucket_id = 'research-pdfs' AND (
--      EXISTS (SELECT 1 FROM project_files pf JOIN projects p ON p.id = pf.project_id
--              WHERE pf.storage_path = name AND p.archived = false)
--      OR EXISTS (SELECT 1 FROM research_posts rp WHERE rp.pdf_path = name)
--    )
--
-- INSERT だけ作っても PDF アップロードは動くことが多いです。
