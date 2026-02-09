'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import ProjectCard from '@/components/ProjectCard'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // プロフィール情報を取得
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // プロフィールが存在しない場合は作成
      if (!profileData) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          .select()
          .single()

        if (!profileError && newProfile) {
          profileData = newProfile
        }
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])
      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* プロフィールヘッダー */}
        <div className="bg-white shadow rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || 'ユーザー'}
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.full_name || '名前未設定'}
                </h1>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-gray-700 mt-2">{profile.bio}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
                  >
                    🔗 {profile.website}
                  </a>
                )}
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              プロフィールを編集
            </Link>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
            <p className="text-gray-600 mt-2">投稿したプロジェクト</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-red-500">
              {projects.reduce((sum, p) => sum + (p.likes_count || 0), 0)}
            </p>
            <p className="text-gray-600 mt-2">獲得したいいね</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
            </p>
            <p className="text-gray-600 mt-2">登録年</p>
          </div>
        </div>

        {/* プロジェクト一覧 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              あなたのプロジェクト
            </h2>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + 新規投稿
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">
                まだプロジェクトを投稿していません
              </p>
              <Link
                href="/projects/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                最初のプロジェクトを投稿する
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
