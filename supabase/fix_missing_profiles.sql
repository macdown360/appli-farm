-- 既存のauth.usersに対応するprofilesレコードが存在しない場合に作成するスクリプト

-- 1. 既存のauth.usersでprofilesが存在しないユーザーを確認
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. 不足しているprofilesレコードを作成
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

-- 3. 結果を確認
SELECT 
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users;
