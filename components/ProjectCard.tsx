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
      <div className="bg-white rounded-xl hover:shadow-md transition-shadow overflow-hidden cursor-pointer h-full flex flex-col border border-gray-100">
        {/* プロジェクト画像 */}
        <div className="relative h-36 md:h-44 bg-gray-50">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl bg-gray-50">
              📄
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {/* タイトル */}
          <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug">
            {project.title}
          </h3>

          {/* 説明 */}
          <p className="text-gray-500 text-xs md:text-sm mb-3 line-clamp-2 flex-grow leading-relaxed">
            {project.description}
          </p>

          {/* タグ */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* フッター：作成者といいね数 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2 min-w-0">
              <Link 
                href={`/profile/${project.user_id}`}
                className="flex items-center space-x-1.5 hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {project.profiles?.avatar_url ? (
                  <Image
                    src={project.profiles.avatar_url}
                    alt={project.profiles.full_name || '匿名'}
                    width={20}
                    height={20}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] flex-shrink-0 text-gray-400">
                    👤
                  </div>
                )}
                <span className="text-xs text-gray-500 truncate">
                  {project.profiles?.full_name || '匿名'}
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 flex-shrink-0 ml-2">
              <span className="text-xs">♥ {project.likes_count}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
