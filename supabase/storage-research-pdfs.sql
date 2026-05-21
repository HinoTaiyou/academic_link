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
drop policy if exists "research_pdfs_insert_own" on storage.objects;
drop policy if exists "research_pdfs_delete_own" on storage.objects;
drop policy if exists "research_pdfs_update_own" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Give users access to own folder" on storage.objects;

-- 読み取り
create policy "research_pdfs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'research-pdfs'
  and (storage.foldername(name))[1] = auth.uid()::text
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
-- 2) SELECT（ダウンロード・署名付き URL）
--    Policy name: research_pdfs_select_own
--    Allowed operation: SELECT
--    Target roles: authenticated
--    USING expression:
--      (bucket_id = 'research-pdfs'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
--
-- INSERT だけ作っても PDF アップロードは動くことが多いです。
