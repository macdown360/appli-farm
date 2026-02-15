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

interface Comment {
  id: string
  project_id: string
  user_id: string
  content: string
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
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
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

      // コメントを取得
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', resolvedParams.id)
        .order('created_at', { ascending: false })

      if (commentsData) {
        setComments(commentsData)
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
    if (!project) return
    
    try {
      await navigator.clipboard.writeText(project.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = project.url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!project || !newComment.trim()) return

    setSubmittingComment(true)

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          project_id: project.id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      if (data) {
        setComments([data, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error)
      alert('コメントの投稿に失敗しました')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!user) return

    const confirmed = window.confirm('このコメントを削除しますか？')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      setComments(comments.filter(comment => comment.id !== commentId))
    } catch (error) {
      console.error('コメントの削除に失敗しました:', error)
      alert('コメントの削除に失敗しました')
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
      <div className="min-h-screen bg-[#f6f6f6]">
        <Navbar />
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const isOwner = user?.id === project.user_id

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8 md:py-10 px-4 sm:px-6">
        <div className="mb-4">
          <Link href="/projects" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 戻る
          </Link>
        </div>

        <article className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* 画像 */}
          {project.image_url && (
            <div className="relative h-48 md:h-96">
              <Image
                src={project.image_url}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-5 md:p-8">
            {/* カテゴリ */}
            {project.categories && project.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block px-2.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* タイトル */}
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {project.title}
            </h1>

            {isOwner && (
              <div className="flex gap-2 mb-5">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-full text-xs hover:bg-gray-50 transition-colors"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1.5 border border-gray-200 text-red-500 rounded-full text-xs hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              </div>
            )}

            {/* 作成者情報 */}
            <Link 
              href={`/profile/${project.user_id}`}
              className="flex items-center gap-2.5 mb-6 hover:opacity-70 transition-opacity w-fit"
            >
              {project.profiles?.avatar_url ? (
                <Image
                  src={project.profiles.avatar_url}
                  alt={project.profiles.full_name || '匿名'}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 text-sm">
                  👤
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {project.profiles?.full_name || '匿名'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(project.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </Link>

            {/* 説明 */}
            <div className="mb-6">
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* タグ */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-100">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-5 py-2.5 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 text-center text-sm transition-colors"
              >
                サイトを開く
              </a>
              
              <button
                onClick={handleLike}
                className={`px-5 py-2.5 rounded-full font-medium border transition-colors text-sm whitespace-nowrap ${
                  isLiked
                    ? 'border-red-200 text-red-500 bg-red-50'
                    : 'border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'
                }`}
              >
                {isLiked ? '❤️' : '♡'} {project.likes_count}
              </button>
            </div>

            {/* シェアボタン */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">シェア</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* X (Twitter) */}
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
                  title="X"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Facebook"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>

                {/* LINE */}
                <button
                  onClick={() => handleShare('line')}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
                  title="LINE"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.63-.63.63h-2.386c-.345 0-.627-.281-.627-.63V8.108c0-.345.282-.627.627-.627h2.386c.349 0 .63.281.63.63 0 .346-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.627.63-.627.345 0 .63.282.63.627v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.627.627-.627.349 0 .631.282.631.627v4.771zm-2.466.627H4.917c-.345 0-.63-.283-.63-.627V8.108c0-.345.285-.627.63-.627.349 0 .63.282.63.627v4.141h1.756c.348 0 .629.283.629.63 0 .346-.281.631-.629.631M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                </button>

                {/* 区切り線 */}
                <div className="hidden md:block w-px h-6 bg-gray-200 mx-1"></div>

                {/* URLコピー */}
                <button
                  onClick={handleCopyUrl}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap flex-shrink-0 ${
                    copied
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {copied ? 'コピーしました' : 'URLをコピー'}
                </button>
              </div>
            </div>

            {/* コメントセクション */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5">
                コメント ({comments.length})
              </h2>

              {/* コメント投稿フォーム */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを書く..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                    disabled={submittingComment}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-5 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? '投稿中...' : '投稿'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    コメントを投稿するにはログインが必要です
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block px-5 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    ログイン
                  </Link>
                </div>
              )}

              {/* コメントリスト */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    まだコメントがありません
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <Link 
                          href={`/profile/${comment.user_id}`}
                          className="flex items-center space-x-2 hover:opacity-70 transition-opacity"
                        >
                          {comment.profiles?.avatar_url ? (
                            <Image
                              src={comment.profiles.avatar_url}
                              alt={comment.profiles.full_name || 'User'}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">
                                {comment.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {comment.profiles?.full_name || '匿名'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </Link>
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                          >
                            削除
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap pl-9">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
