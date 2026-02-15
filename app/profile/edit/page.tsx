'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'

export default function ProfileEditPage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [noteUrl, setNoteUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, bio, website, avatar_url, github_url, x_url, linkedin_url, note_url')
        .eq('id', user.id)
        .single()

      setFullName(profileData?.full_name ?? '')
      setBio(profileData?.bio ?? '')
      setWebsite(profileData?.website ?? '')
      setAvatarUrl(profileData?.avatar_url ?? '')
      setGithubUrl(profileData?.github_url ?? '')
      setXUrl(profileData?.x_url ?? '')
      setLinkedinUrl(profileData?.linkedin_url ?? '')
      setNoteUrl(profileData?.note_url ?? '')

      if (profileData?.avatar_url) {
        setAvatarPreview(profileData.avatar_url)
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  // 画像アップロード関連
  const handleFileChange = (file: File | null) => {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('画像ファイルは5MB以下にしてください')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }

    setAvatarFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // URLバリデーション
  const validateSocialUrl = (url: string, domain: string): boolean => {
    if (!url) return true
    try {
      const parsed = new URL(url)
      return parsed.hostname.includes(domain)
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    if (!user) {
      setError('ログインが必要です')
      setSaving(false)
      return
    }

    // SNS URLバリデーション
    if (githubUrl && !validateSocialUrl(githubUrl, 'github.com')) {
      setError('GitHub URLは github.com のURLを入力してください')
      setSaving(false)
      return
    }
    if (xUrl && !validateSocialUrl(xUrl, 'x.com') && !validateSocialUrl(xUrl, 'twitter.com')) {
      setError('X (Twitter) URLは x.com または twitter.com のURLを入力してください')
      setSaving(false)
      return
    }
    if (linkedinUrl && !validateSocialUrl(linkedinUrl, 'linkedin.com')) {
      setError('LinkedIn URLは linkedin.com のURLを入力してください')
      setSaving(false)
      return
    }
    if (noteUrl && !validateSocialUrl(noteUrl, 'note.com')) {
      setError('Note URLは note.com のURLを入力してください')
      setSaving(false)
      return
    }

    try {
      let uploadedAvatarUrl = avatarUrl

      // 画像をアップロード
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, avatarFile, { upsert: false })

        if (uploadError) {
          console.error('Upload error:', uploadError)

          if (uploadError.message === 'Bucket not found') {
            throw new Error(
              'Supabase Storage の設定がまだ完了していません。\n' +
              'SETUP.md を参照して「project-images」バケットを作成してください。'
            )
          }

          if (uploadError.message.includes('row-level security policy')) {
            throw new Error(
              'Supabase Storage のセキュリティポリシーが正しく設定されていません。\n' +
              'SETUP.md を参照してRLSポリシーを設定してください。'
            )
          }

          throw new Error(`画像アップロード失敗: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath)

        uploadedAvatarUrl = publicUrl
      }

      // アバターが削除された場合
      if (!avatarPreview) {
        uploadedAvatarUrl = ''
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          avatar_url: uploadedAvatarUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          x_url: xUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          note_url: noteUrl.trim() || null,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message || 'プロフィールの更新に失敗しました')
        setSaving(false)
        return
      }

      setSuccess('プロフィールを更新しました')
      setSaving(false)
    } catch (err: any) {
      setError(err.message || '更新に失敗しました')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f6]">
        <Navbar />
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <Navbar />

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-6">
          <Link href="/profile" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 戻る
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3">
            プロフィールを編集
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* ==================== セクション1: プロフィール画像 ==================== */}
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">プロフィール画像</h2>
              <p className="text-xs text-gray-400 mt-0.5">あなたの顔をアピールしましょう（任意）</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-6">
                {/* 現在のアバタープレビュー */}
                <div className="flex-shrink-0">
                  {avatarPreview ? (
                    <div className="relative w-24 h-24">
                      <Image
                        src={avatarPreview}
                        alt="アバタープレビュー"
                        fill
                        className="rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl border-2 border-dashed border-gray-300">
                      👤
                    </div>
                  )}
                </div>

                {/* アップロードエリア */}
                <div className="flex-1">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                      aria-label="プロフィール画像を選択"
                    />
                    <p className="text-gray-700 font-medium text-sm">
                      📷 画像をドラッグ&ドロップ
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      またはクリックして選択
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      JPG, PNG, GIF, WebP（最大5MB）
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== セクション2: 基本情報 ==================== */}
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">基本情報</h2>
              <p className="text-xs text-gray-400 mt-0.5">名前や自己紹介を入力してください</p>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                  placeholder="表示名"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-y text-sm"
                  placeholder="簡単な自己紹介を入力してください"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Webサイト
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔗</span>
                  <input
                    type="url"
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ==================== セクション3: SNSリンク ==================== */}
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">SNSリンク</h2>
              <p className="text-xs text-gray-400 mt-0.5">各サービスのプロフィールURLを入力してください（任意）</p>
            </div>
            <div className="p-5 space-y-4">
              {/* GitHub */}
              <div>
                <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </span>
                  <input
                    type="url"
                    id="githubUrl"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              {/* X (Twitter) */}
              <div>
                <label htmlFor="xUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  X (Twitter)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </span>
                  <input
                    type="url"
                    id="xUrl"
                    value={xUrl}
                    onChange={(e) => setXUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                    placeholder="https://x.com/username"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 text-base">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </span>
                  <input
                    type="url"
                    id="linkedinUrl"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label htmlFor="noteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000"><rect x="0" y="0" width="24" height="24" rx="4"/><path d="M7 16h3V10l5 6h3V7h-3v6l-5-6H7v9z" fill="white"/></svg>
                  </span>
                  <input
                    type="url"
                    id="noteUrl"
                    value={noteUrl}
                    onChange={(e) => setNoteUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm"
                    placeholder="https://note.com/username"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ==================== 送信ボタン ==================== */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                href="/profile"
                className="w-full sm:w-auto text-center px-5 py-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors text-sm"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {saving ? '保存中...' : '変更を保存'}
              </button>
            </div>

            {success && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm text-center">
                {success}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
