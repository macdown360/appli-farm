# 外部キー制約エラーの修正

## 問題
`insert or update on table "projects" violates foreign key constraint "projects_user_id_fkey"`

## 原因
`projects`テーブルの`user_id`が`profiles.id`を参照していますが、一部のユーザーに対応する`profiles`レコードが存在していませんでした。

## 修正内容

### 1. 新規プロジェクト作成ページ ([app/projects/new/page.tsx](../app/projects/new/page.tsx))
- プロジェクト作成前にプロフィールの存在を確認
- プロフィールが存在しない場合は自動作成する処理を追加

### 2. プロフィールページ ([app/profile/page.tsx](../app/profile/page.tsx))
- プロフィール取得時に存在しない場合は自動作成する処理を追加

### 3. サインアップページ ([app/auth/signup/page.tsx](../app/auth/signup/page.tsx))
- ユーザー作成後に確実にプロフィールを作成するよう`upsert`処理を追加

### 4. 既存ユーザーの修復スクリプト ([supabase/fix_missing_profiles.sql](../supabase/fix_missing_profiles.sql))
- 既存のauth.usersでprofilesが存在しない場合に作成するSQLスクリプト

## 既存ユーザーの修復方法

Supabaseダッシュボードで以下のSQLを実行してください:

```sql
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

または、用意したスクリプトファイルを使用:
```bash
# Supabase CLIを使用する場合
supabase db execute --file supabase/fix_missing_profiles.sql
```

## 今後の対策

1. **データベーストリガー**: `schema.sql`にある`handle_new_user()`トリガーが正常に動作していることを確認
2. **アプリケーション層での保護**: 上記の修正により、プロフィールが存在しない場合でも自動作成されるようになりました
3. **監視**: 定期的に`auth.users`と`profiles`の整合性を確認することを推奨

## 確認方法

1. ユーザーとプロフィールの数を確認:
```sql
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles;
```

2. プロフィールが存在しないユーザーを確認:
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```
