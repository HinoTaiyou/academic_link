# 🎓 Academic Link

研究者マッチング＆ナレッジ共有プラットフォーム。  
自分の興味タグや論文をもとに、同じ分野の仲間を見つけられるゼミ内向け Web アプリです。

**Tech Stack**: Next.js 16 (App Router) / React 19 / Tailwind CSS v4 / shadcn/ui / Supabase (Auth + DB + Storage) / Gemini AI

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| 認証 | メール + パスワードでサインアップ / ログイン / ログアウト |
| オンボーディング | 初回ログイン時に興味タグ・研究分野を選択 |
| ニュース | 興味タグに基づく Google News の自動取得（誤爆防止つき） |
| プロフィール | 公開ビュー `/u/[id]` + 編集 `/profile` |
| メンバー検索 | 興味タグの共通数順に他のメンバーを一覧表示 |
| 研究登録 | PDF or テキスト → Gemini AI が要約・タグ生成 → プロフィールに公開 |
| サイドバー | レスポンシブ対応。PC は常時表示、モバイルはドロワー |

---

## セットアップ手順（初めての人向け）

### 1. リポジトリをクローン

```bash
git clone https://github.com/HinoTaiyou/academic_link.git
cd academic_link
npm install
```

### 2. Supabase プロジェクトを用意

1. <https://app.supabase.com/> でプロジェクトを開く（なければ新規作成）
2. 左メニュー → **SQL Editor** → `supabase-schema.sql` の中身をコピペして **Run**
3. **Storage** → **New bucket** → 名前 `research-pdfs`（Private / Public OFF）で作成
4. 再度 **SQL Editor** で `supabase-schema.sql` 末尾の **Storage policies** セクションを実行

これで以下が作られます:
- `profiles` / `research_posts` / `research_updates` / `messages` テーブル
- 全テーブルの RLS ポリシー
- サインアップ時に `profiles` 行を自動生成する trigger
- `research-pdfs` バケットの読み書きポリシー

### 3. メール確認を OFF にする（開発中）

- Supabase ダッシュボード → **Authentication** → **Sign In / Providers** → **Email**
- **Confirm email** を **OFF**

### 4. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下を埋める:

| 変数 | 取得場所 |
|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 → `anon` `public` key |
| `GEMINI_API_KEY` | <https://aistudio.google.com/app/apikey> で発行 |

### 5. 起動

```bash
npm run dev
```

→ <http://localhost:3000> を開く

---

## 動作確認

1. `/signup` でアカウント作成
2. 初回は `/onboarding` に飛ぶ → 興味タグを選んで保存
3. `/dashboard` にニュースが表示される
4. サイドバーから各機能にアクセス:
   - **プロフィール**: 公開ビュー確認 + 編集
   - **メンバー検索**: 他メンバーとの共通タグ数で並ぶ
   - **研究を登録**: PDF アップロード → AI 要約 → 保存

---

## ディレクトリ構成

```
src/
├── app/
│   ├── dashboard/       # ホーム（ニュース）
│   ├── login/ signup/   # 認証
│   ├── onboarding/      # 初回タグ設定
│   ├── profile/         # プロフィール編集
│   ├── u/[id]/          # 公開プロフィール + 研究一覧
│   ├── members/         # メンバー検索
│   └── research/new/    # 研究登録（AI 解析）
├── components/
│   ├── layout/          # AppShell, AppSidebar
│   ├── news/            # ニュースカード・セクション
│   ├── members/         # メンバーカード・タグフィルター
│   ├── profile/         # プロフィール表示・編集・タグピッカー
│   ├── research/        # 研究フォーム・一覧
│   └── ui/              # shadcn/ui (Button, Input, etc.)
├── lib/
│   ├── auth/            # Server Actions (login/signup/logout)
│   ├── constants/       # タグ・学部・学年の定数
│   ├── members/         # マッチングスコア計算
│   ├── news/            # RSS取得・タグマッチング
│   ├── profile/         # プロフィール保存 Actions
│   ├── research/        # PDF抽出・Gemini要約・保存 Actions
│   └── supabase/        # Supabase クライアント (server/client/middleware)
└── proxy.ts             # Next 16 proxy convention
```

---

## Vercel にデプロイ（任意）

1. <https://vercel.com> で Import → このリポジトリを選択
2. **Root Directory**: `.`（デフォルトのまま）
3. **Environment Variables** に `.env.local` と同じ3つを設定
4. **Deploy**
5. Supabase の Authentication → URL Configuration に Vercel のドメインを追加

---

## 困ったとき

| 症状 | 対処 |
|------|------|
| ログインできない | `.env.local` を確認 → `npm run dev` 再起動 |
| `profiles upsert` エラー | SQL Editor で `supabase-schema.sql` を再実行 |
| PDF アップロード失敗（RLS） | `supabase/storage-research-pdfs.sql` を SQL Editor で実行。または `.env.local` に `SUPABASE_SERVICE_ROLE_KEY` を追加 |
| PDF アップロード失敗（バケット） | Storage に `research-pdfs` バケット（Private）を作成 |
| AI 解析が動かない | `GEMINI_API_KEY` が `.env.local` にあるか。dev を再起動したか |
| サイドバーが出ない | ブラウザ幅 768px 以上で表示。狭いときは ≡ をタップ |

---

## ライセンス

MIT
