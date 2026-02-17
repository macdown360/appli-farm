# AIで作ってみた件 - セットアップガイド

## 🚀 クイックスタート

このプロジェクトを始めるには、以下の手順に従ってください。

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、無料アカウントを作成
2. 「New Project」をクリックして新しいプロジェクトを作成
3. プロジェクト名、データベースパスワードを設定
4. リージョンを選択（日本なら Tokyo がおすすめ）
5. プロジェクトが作成されるまで数分待つ

### 2. データベーススキーマの構築

**⚠️ 重要: ファイルパスではなく、ファイルの中身をコピーしてください！**

1. Supabaseダッシュボードの左サイドバーから「**SQL Editor**」を選択
2. 「**New query**」をクリック
3. VS Codeで `supabase/schema.sql` ファイルを開く
4. ファイルの**中身を全てコピー**（Ctrl+A → Ctrl+C）
5. SupabaseのSQL Editorに**貼り付け**（Ctrl+V）
6. 「**Run**」ボタン（緑色の再生ボタン）をクリックして実行
7. ✅ 「Success. No rows returned」メッセージが表示されればOK！

> ❌ `'/workspaces/ai-tsuku/supabase/schema.sql'` とファイルパスを入力しないでください  
> ✅ ファイルの中身（SQLコード）をコピー&ペーストしてください

### 3. Supabase Storage のセットアップ

**必須: 画像アップロード機能に必要です**

#### ステップ 1: バケット作成

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左メニューの「**Storage**」をクリック
4. 「**Create a new bucket**」をクリック
5. 名前に `project-images` と入力
6. 「**Public bucket**」✅ にチェック
7. 「**Create bucket**」をクリック

#### ステップ 2: RLS ポリシー設定（重要！）

バケット作成後、セキュリティポリシーを設定します：

1. 作成した `project-images` バケットをクリック
2. 「**Policies**」タブをクリック
3. 左側の「**New Policy**」をクリック
4. テンプレートから「**CREATE**」を選択（または「For authenticated users」→「CREATE」）
5. 表示されたウィザードで：
   - Operation: `INSERT` が選択されていることを確認
   - Target roles: `authenticated` が選択されていることを確認
   - USING expression: ポリシー定義欄は **空のままか、デフォルトのまま**
6. 「**Review policy**」をクリック
7. 「**Create policy**」をクリック

8. 次に **SELECT ポリシー**も作成します：
   - 「**New Policy**」をクリック
   - テンプレートから「**SELECT**」を選択
   - Operation: `SELECT`、Target roles: `public`（または `anon`）
   - USING expression: 空のまままたはデフォルト
   - 「**Review policy**」→「**Create policy**」

✅ これでポリシー設定が完了しました

**確認方法:**
- Storage → `project-images` → Policies で2つのポリシー（INSERT と SELECT）が表示されている
- ブラウザの開発者ツールにエラーが出ていないことを確認してから、再度画像アップロードを試してください

**もし設定後もエラーが出る場合:**
- 開発者ツール（F12）でコンソールエラーをコピーして確認
- または、画像なしでプロジェクトを公開してみてください（オプション機能のため機能します）

### 4. 環境変数の設定

1. Supabaseダッシュボードの「Settings」→「API」を開く
2. 以下の情報をコピー:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. `.env.local` ファイルを編集:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 📋 チェックリスト

- [ ] Supabaseプロジェクトを作成
- [ ] データベーススキーマを実行
- [ ] Supabase Storageバケット（project-images）を作成
- [ ] `.env.local` に認証情報を設定
- [ ] `npm install` を実行（初回のみ）
- [ ] `npm run dev` で開発サーバーを起動
- [ ] ブラウザで動作確認

## 🔧 トラブルシューティング

### エラー: "Invalid API key"
- `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
- Supabaseダッシュボードから最新のキーをコピーし直す

### エラー: "relation does not exist"
- `supabase/schema.sql` が正しく実行されているか確認
- Supabaseの「Table Editor」でテーブルが作成されているか確認

### エラー: 画像がアップロードできない・「未認可」エラーが出る
- Supabase Storage の `project-images` バケットが存在するか確認
- バケットの **RLS Policies** が正しく設定されているか確認
  - `SELECT` ポリシーが存在し、条件が `true` になっているか
  - `CREATE` ポリシーが存在し、認証ユーザーが作成可能か
- ブラウザのコンソールで詳しいエラーメッセージを確認（F12キー）

### エラー: ページが表示されない
- `npm run dev` が正常に起動しているか確認
- ターミナルでエラーメッセージを確認
- ブラウザのコンソールでエラーを確認

## 📚 次のステップ

1. 新規登録でアカウントを作成
2. プロジェクトを公開してみる
3. 他のユーザーのプロジェクトにいいねする
4. プロフィールをカスタマイズする

## 🎨 カスタマイズ

- カラーテーマを変更: `tailwind.config.ts` を編集
- ナビゲーションを変更: `components/Navbar.tsx` を編集
- ロゴを変更: 絵文字を別のものに置き換え

## � お問い合わせフォームのメール送信設定

お問い合わせフォームからのメール送信を有効にするには、Resendサービスの設定が必要です。

### Resendの設定（推奨）

1. [Resend](https://resend.com)にアクセスしてサインアップ
2. ダッシュボードで新しいAPIキーを生成
3. `.env.local` ファイルに以下を追加：
   ```
   RESEND_API_KEY=your_resend_api_key_here
   ```
4. アプリケーションを再起動

**メール送信設定なしの場合:**
- お問い合わせフォームは機能しますが、メール通知は送信されません
- サーバーコンソールにお問い合わせ情報がログ出力されます

## �📞 サポート

問題が解決しない場合は、GitHubのIssuesでお知らせください。
