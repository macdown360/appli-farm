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
  categories: string[]
  tags: string[]
  likes_count: number
  created_at: string
  updated_at: string
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
  const [copied, setCopied] = useState(false)
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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = window.location.href
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!project) return

    const confirmed = window.confirm('このプロジェクトを削除しますか？この操作は取り消せません。')
    if (!confirmed) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    if (error) {
      console.error('プロジェクトの削除に失敗しました:', error)
      window.alert('削除に失敗しました。もう一度お試しください。')
      return
    }

    router.push('/projects')
    router.refresh()
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

  const isOwner = user?.id === project.user_id

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
            {project.categories && project.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* タイトル */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {project.title}
            </h1>

            {isOwner && (
              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                >
                  編集する
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  削除する
                </button>
              </div>
            )}

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
                  種をまいた日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
                </p>
                <p className="text-sm text-gray-500">
                  最終更新日: {new Date(project.updated_at).toLocaleDateString('ja-JP')}
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
              <p className="text-sm font-medium text-gray-700 mb-4">シェアする</p>
              <div className="flex items-center gap-3">
                {/* X (Twitter) */}
                <button
                  onClick={() => handleShare('twitter')}
                  className="group relative w-11 h-11 rounded-full bg-gray-100 hover:bg-black text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                  title="X (Twitter) でシェア"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShare('facebook')}
                  className="group relative w-11 h-11 rounded-full bg-gray-100 hover:bg-[#1877F2] text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                  title="Facebook でシェア"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>

                {/* LINE */}
                <button
                  onClick={() => handleShare('line')}
                  className="group relative w-11 h-11 rounded-full bg-gray-100 hover:bg-[#06C755] text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                  title="LINE でシェア"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.63-.63.63h-2.386c-.345 0-.627-.281-.627-.63V8.108c0-.345.282-.627.627-.627h2.386c.349 0 .63.281.63.63 0 .346-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.627.63-.627.345 0 .63.282.63.627v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.627.627-.627.349 0 .631.282.631.627v4.771zm-2.466.627H4.917c-.345 0-.63-.283-.63-.627V8.108c0-.345.285-.627.63-.627.349 0 .63.282.63.627v4.141h1.756c.348 0 .629.283.629.63 0 .346-.281.631-.629.631M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                </button>

                {/* 区切り線 */}
                <div className="w-px h-8 bg-gray-200 mx-1"></div>

                {/* URLコピー */}
                <button
                  onClick={handleCopyUrl}
                  className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent hover:border-gray-300'
                  }`}
                  title="URLをコピー"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      コピーしました
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.657-3.07a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" /></svg>
                      URLをコピー
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
