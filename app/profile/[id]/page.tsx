'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import ProjectCard from '@/components/ProjectCard'

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return

    const fetchProfile = async () => {
      setLoading(true)

      // 現在のログインユーザーを取得
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 自分自身のプロフィールページにアクセスした場合は/profileにリダイレクト
      if (user && user.id === resolvedParams.id) {
        router.push('/profile')
        return
      }

      // プロフィール情報を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (!profileData) {
        // プロフィールが存在しない場合
        setLoading(false)
        return
      }

      setProfile(profileData)

      // ユーザーのプロジェクトを取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', resolvedParams.id)
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])
      setLoading(false)
    }

    fetchProfile()
  }, [resolvedParams, supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f6]">
        <Navbar />
        <div className="max-w-5xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f6f6f6]">
        <Navbar />
        <div className="max-w-5xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-400 text-sm mb-3">プロフィールが見つかりません</p>
          <Link href="/projects" className="text-emerald-500 hover:text-emerald-600 text-sm">
            作品一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <Navbar />

      <div className="max-w-5xl mx-auto py-8 md:py-10 px-4 sm:px-6">
        <div className="mb-4">
          <Link href="/projects" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 戻る
          </Link>
        </div>

        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-8 mb-4">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || 'ユーザー'}
                width={80}
                height={80}
                className="rounded-full flex-shrink-0 w-20 h-20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                👤
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                {profile?.full_name || '名前未設定'}
              </h1>
              {profile?.bio && (
                <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:text-emerald-600 mt-1 inline-block text-sm"
                >
                  {profile.website}
                </a>
              )}

              {/* SNSリンク */}
              {(profile?.github_url || profile?.x_url || profile?.linkedin_url || profile?.note_url) && (
                <div className="flex items-center gap-3 mt-3">
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" title="GitHub">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {profile?.x_url && (
                    <a href={profile.x_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" title="X">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="LinkedIn">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                  {profile?.note_url && (
                    <a href={profile.note_url} target="_blank" rel="noopener noreferrer" className="transition-colors" title="Note">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000"><rect x="0" y="0" width="24" height="24" rx="4"/><path d="M7 16h3V10l5 6h3V7h-3v6l-5-6H7v9z" fill="white"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{projects.length}</p>
            <p className="text-xs text-gray-400 mt-1">公開した作品</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">
              {projects.reduce((sum, p) => sum + (p.likes_count || 0), 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">もらったいいね</p>
          </div>
        </div>

        {/* プロジェクト一覧 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            {profile?.full_name || 'このユーザー'}の作品
          </h2>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 md:p-12 text-center">
              <p className="text-gray-400 text-sm">
                まだ作品が公開されていません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
