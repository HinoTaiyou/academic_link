# Academic Link (Next.js 16 + Supabase)

旧 `app.py` (Streamlit) の Web 版リライト。
**Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui + Supabase Auth** で構築。

## 現状

- メールアドレス + パスワードでの **新規登録 / ログイン / ログアウト** が動作
- **初回ログイン後**: `profiles` の「興味タグ」「研究分野」がどちらも空なら **`/onboarding`** でタグ選択（`app.py` の DS タグ一覧と同等）。保存後に `/dashboard` へ
- 認証必須の `/dashboard` でアカウント情報とタグを表示
- 未ログインで保護ページに来たら `/login` にリダイレクト
- ログイン済みで `/login` `/signup` に来たら、オンボーディング未完了なら `/onboarding`、完了なら `/dashboard` にリダイレクト

## ディレクトリ

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 起点: ログイン状態に応じて /dashboard か /login へ
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── dashboard/page.tsx    # 認証必須 (server-side check)
│   ├── onboarding/page.tsx   # 初回: 興味タグ・研究分野の選択
│   └── auth/callback/route.ts # Supabase メール確認の戻り先
├── components/
│   ├── auth/auth-form.tsx    # ログイン / 新規登録共用フォーム
│   ├── onboarding/onboarding-form.tsx
│   ├── profile/tag-picker.tsx
│   └── ui/                   # shadcn/ui
├── lib/
│   ├── constants/profile.ts  # DS タグ・学部・学年（app.py 相当）
│   ├── auth/actions.ts       # loginAction / signupAction / logoutAction
│   ├── profile/actions.ts    # saveOnboardingAction → profiles UPSERT
│   ├── profile/onboarding.ts # オンボーディング完了判定
│   ├── supabase/client.ts    # ブラウザ向けクライアント
│   ├── supabase/server.ts    # Server Components / Actions 向け
│   └── supabase/middleware.ts# updateSession + オンボーディングリダイレクト
└── proxy.ts                  # Next 16 の proxy convention (旧 middleware.ts) で updateSession を呼ぶ
```

## セットアップ手順

### 1. Supabase の DB スキーマを流す（初回のみ）

リポジトリのルートにある `../supabase/schema.sql` をそのまま使えます。

1. <https://app.supabase.com/> でプロジェクトを開く
2. 左メニュー → **SQL Editor**
3. `supabase/schema.sql` の中身を全部コピペして **Run**

これで以下が作られます:
- `profiles` / `research_posts` / `research_updates` / `messages` テーブル
- 全テーブルの **RLS ポリシー**
- サインアップ時に `profiles` 行を自動生成する trigger
- `updated_at` を自動更新する trigger

### 2. メール確認の挙動を選ぶ

開発中はオフが楽です:
- Supabase ダッシュボード → **Authentication** → **Sign In / Providers** → **Email**
- **Confirm email** を OFF にすると、登録した瞬間からログイン可能

本番で ON に戻したい場合は、Authentication → URL Configuration の **Site URL** と **Redirect URLs** に
`http://localhost:3000` と本番ドメイン、および `/auth/callback` を登録しておく。

### 3. 環境変数

`.env.local`（コミット禁止）にすでに値を入れてあります:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
別プロジェクトに切り替えるときは `.env.example` を見ながら書き換えてください。

### 4. 起動

```bash
npm install   # 既に実行済み
npm run dev
```

→ <http://localhost:3000>

## 動作確認手順

1. <http://localhost:3000/> を開く（未ログインなら `/login` に飛ばされる）
2. 「新規登録」リンクから `/signup` に行き、メールアドレスとパスワード（6 文字以上）で登録
3. Confirm email が OFF ならログイン後、**タグ未設定なら `/onboarding`** に誘導される
4. 興味または研究のどちらかにタグを1つ以上選んで保存 → `/dashboard`
5. 「ログアウト」で `/login` に戻る

## このあと追加していくもの (旧 app.py の機能を順次移植)

- `/profile` … プロフィール編集（オンボーディング後のタグ変更など。現状は初回のみ `/onboarding`）
- `/research` … 研究投稿（PDF アップロード + Storage `research-pdfs` 連携）
- `/network` … 研究者ネットワーク図
- `/search` … キャンパス内検索
- `/chat` … DM (`messages` テーブル + Realtime)

## 詰まったときに見る場所

- ログインに失敗する → ブラウザの DevTools Network タブで Supabase エンドポイントへの 4xx を確認
- `Invalid login credentials` → メアド・パスワードの綴りか、メール確認 ON のままになっている
- `getUser()` が常に null → `.env.local` を変えたあと `npm run dev` を **再起動**したか確認
