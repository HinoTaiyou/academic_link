このディレクトリには Supabase に適用する SQL マイグレーションを置きます。

今回追加したファイル:
- 20260521_add_pg_trgm_search_index.sql — `pg_trgm` を有効化し、`research_posts` と `project_files` 用の GIN トライグラム索引を作成します。

適用方法:
1. Supabase プロジェクトの SQL Editor にログインします。
2. 上記ファイルの内容をコピーして実行するか、CLI から `psql` 等で実行します。

注意:
- 本番環境で適用する前にステージングでパフォーマンステストを行ってください。
- 大きなテーブルでインデックス作成は時間と IO を要します。オフピークで実行するか、CONCURRENTLY オプションを検討してください。

例 (psql):

```bash
psql "postgresql://<user>:<password>@<host>:5432/<db>" -f 20260521_add_pg_trgm_search_index.sql
```

-- End
