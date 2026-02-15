'use client'

import Link from 'next/link'
import Image from 'next/image'

interface ProjectCardProps {
  project: {
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
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        {/* プロジェクト画像 */}
        <div className="relative h-32 md:h-48 bg-gray-200">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl md:text-4xl bg-green-50">
              🌱
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-grow">
          {/* カテゴリタグ */}
          {project.categories && project.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {project.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full w-fit"
                >
                  {cat}
                </span>
              ))}
              {project.categories.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full w-fit">
                  +{project.categories.length - 2}
                </span>
              )}
            </div>
          )}

          {/* タイトル */}
          <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>

          {/* 説明 */}
          <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-3 flex-grow">
            {project.description}
          </p>

          <p className="text-xs text-gray-500 mb-1">
            種をまいた日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            最終更新日: {new Date(project.updated_at).toLocaleDateString('ja-JP')}
          </p>

          {/* タグ */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* フッター：作成者といいね数 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 min-w-0">
              <Link 
                href={`/profile/${project.user_id}`}
                className="flex items-center space-x-2 hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {project.profiles?.avatar_url ? (
                  <Image
                    src={project.profiles.avatar_url}
                    alt={project.profiles.full_name || '匿名ユーザー'}
                    width={24}
                    height={24}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs flex-shrink-0">
                    👤
                  </div>
                )}
                <span className="text-xs md:text-sm text-gray-600 truncate">
                  {project.profiles?.full_name || '匿名ユーザー'}
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-1 text-gray-600 flex-shrink-0 ml-2">
              <span>❤️</span>
              <span className="text-xs md:text-sm">{project.likes_count}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
