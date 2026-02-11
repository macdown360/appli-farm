'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'

interface Project {
  id: string
  user_id: string
  title: string
  description: string
  url: string
  image_url: string | null
  category: string | null
  tags: string[]
  likes_count: number
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<Project | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return

    const fetchProject = async () => {
      setLoading(true)
      
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // プロジェクト情報を取得
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', resolvedParams.id)
        .single()

      if (error || !projectData) {
        console.error(error)
        router.push('/projects')
        return
      }

      setProject(projectData)

      // いいね状態を取得
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', resolvedParams.id)
          .single()

        setIsLiked(!!likeData)
      }

      setLoading(false)
    }

    fetchProject()
  }, [resolvedParams, supabase, router])

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!project) return

    try {
      if (isLiked) {
        // いいねを削除
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', project.id)

        await supabase
          .from('projects')
          .update({ likes_count: Math.max(0, project.likes_count - 1) })
          .eq('id', project.id)

        setProject({ ...project, likes_count: Math.max(0, project.likes_count - 1) })
        setIsLiked(false)
      } else {
        // いいねを追加
        await supabase
          .from('likes')
          .insert({ user_id: user.id, project_id: project.id })

        await supabase
          .from('projects')
          .update({ likes_count: project.likes_count + 1 })
          .eq('id', project.id)

        setProject({ ...project, likes_count: project.likes_count + 1 })
        setIsLiked(true)
      }
    } catch (error) {
      console.error('いいねの更新に失敗しました:', error)
    }
  }

  const handleShare = (platform: string) => {
    if (!project) return

    const shareUrl = encodeURIComponent(window.location.href)
    const shareText = encodeURIComponent(`${project.title} - Appli Farm`)

    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`
        break
      case 'line':
        url = `https://line.me/R/msg/text/?${shareText}%20${shareUrl}`
        break
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/projects" className="text-green-600 hover:text-green-700 flex items-center">
            ← みんなの畑に戻る
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* 画像 */}
          {project.image_url && (
            <div className="relative h-96">
              <Image
                src={project.image_url}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* カテゴリ */}
            {project.category && (
              <span className="inline-block px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full mb-4">
                {project.category}
              </span>
            )}

            {/* タイトル */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>

            {/* 作成者情報 */}
            <div className="flex items-center space-x-3 mb-6">
              {project.profiles?.avatar_url ? (
                <Image
                  src={project.profiles.avatar_url}
                  alt={project.profiles.full_name || '匿名ユーザー'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  👤
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {project.profiles?.full_name || '匿名ユーザー'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(project.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>

            {/* 説明 */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* タグ */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-center"
              >
                🌿 サイトを開く
              </a>
              
              <button
                onClick={handleLike}
                className={`px-6 py-3 rounded-lg font-medium border-2 transition-colors ${
                  isLiked
                    ? 'border-red-500 text-red-500 bg-red-50'
                    : 'border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500'
                }`}
              >
                {isLiked ? '❤️' : '🤍'} {project.likes_count}
              </button>
            </div>

            {/* シェアボタン */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">シェアする</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-4 py-2 bg-[#1DA1F2] text-white rounded-md hover:bg-[#1a8cd8] font-medium"
                >
                  𝕏 Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="px-4 py-2 bg-[#1877F2] text-white rounded-md hover:bg-[#166fe5] font-medium"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('line')}
                  className="px-4 py-2 bg-[#00B900] text-white rounded-md hover:bg-[#009900] font-medium"
                >
                  LINE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
