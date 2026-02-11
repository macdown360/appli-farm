# Appli Farm 🌱

自分が作ったWEBサイトやアプリを公開して、利用者からのフィードバックを受けながら一緒に育てていくプラットフォーム

## 機能

- 🌱 **種をまく**: タイトル、説明、URLを入力するだけで簡単にアプリを公開
- 🌻 **発見しやすい**: カテゴリやタグで整理され、検索機能で目的のアプリがすぐに見つかる
- 👤 **ユーザー認証**: Supabaseによる安全なユーザー登録・ログイン機能
- 💧 **水をやる**: 気に入ったアプリにいいね
- 📱 **SNSシェア**: Twitter、Facebook、LINEでプロジェクトをシェア
- 🎨 **モダンなUI**: Tailwind CSSによる美しいデザイン

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド/認証**: Supabase (PostgreSQL)
- **デプロイ**: Vercel (推奨)

## セットアップ

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. SQL Editorで \`supabase/schema.sql\` の内容を実行してデータベースを構築

### 3. 環境変数の設定

\`.env.local.example\` をコピーして \`.env.local\` を作成し、Supabaseの認証情報を設定:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

\`.env.local\` を編集:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

Supabaseプロジェクトの設定から以下の情報を取得:
- Project URL → \`NEXT_PUBLIC_SUPABASE_URL\`
- API Keys の anon/public → \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`

### 4. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## プロジェクト構造

\`\`\`
tool-park/
├── app/                      # Next.js App Router
│   ├── auth/                # 認証ページ
│   │   ├── login/          # ログインページ
│   │   └── signup/         # 新規登録ページ
│   ├── projects/           # プロジェクト関連
│   │   ├── [id]/          # プロジェクト詳細ページ
│   │   ├── new/           # プロジェクト投稿ページ
│   │   └── page.tsx       # プロジェクト一覧ページ
│   ├── profile/           # プロフィールページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── Navbar.tsx        # ナビゲーション
│   └── ProjectCard.tsx   # プロジェクトカード
├── lib/                  # ユーティリティ
│   └── supabase/        # Supabase設定
│       ├── client.ts    # クライアントサイド
│       └── server.ts    # サーバーサイド
├── types/               # TypeScript型定義
│   └── database.types.ts # データベース型
├── supabase/           # Supabaseスキーマ
│   └── schema.sql      # データベーススキーマ
└── middleware.ts       # Next.js ミドルウェア
\`\`\`

## データベーススキーマ

### profiles テーブル
ユーザープロフィール情報

- \`id\`: UUID (Primary Key, 外部キー: auth.users)
- \`email\`: TEXT (メールアドレス)
- \`full_name\`: TEXT (氏名)
- \`avatar_url\`: TEXT (アバター画像URL)
- \`bio\`: TEXT (自己紹介)
- \`website\`: TEXT (ウェブサイトURL)

### projects テーブル
投稿されたプロジェクト情報

- \`id\`: UUID (Primary Key)
- \`user_id\`: UUID (外部キー: profiles)
- \`title\`: TEXT (タイトル)
- \`description\`: TEXT (説明)
- \`url\`: TEXT (プロジェクトURL)
- \`image_url\`: TEXT (画像URL)
- \`category\`: TEXT (カテゴリ)
- \`tags\`: TEXT[] (タグ配列)
- \`likes_count\`: INTEGER (いいね数)

### likes テーブル
プロジェクトへのいいね

- \`id\`: UUID (Primary Key)
- \`user_id\`: UUID (外部キー: profiles)
- \`project_id\`: UUID (外部キー: projects)

## デプロイ

### Vercelにデプロイ

1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリをインポート
3. 環境変数を設定
4. デプロイ

### その他のプラットフォーム

Next.jsアプリケーションは以下のプラットフォームにもデプロイ可能:
- Netlify
- Railway
- AWS Amplify
- Cloudflare Pages

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。
