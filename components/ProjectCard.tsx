import Link from 'next/link'
import Image from 'next/image'

interface ProjectCardProps {
  project: {
    id: string
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
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
        {/* プロジェクト画像 */}
        <div className="relative h-48 bg-gray-200">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl bg-green-50">
              🌱
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {/* カテゴリタグ */}
          {project.category && (
            <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full w-fit mb-2">
              {project.category}
            </span>
          )}

          {/* タイトル */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.title}
          </h3>

          {/* 説明 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {project.description}
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
            <div className="flex items-center space-x-2">
              {project.profiles?.avatar_url ? (
                <Image
                  src={project.profiles.avatar_url}
                  alt={project.profiles.full_name || '匿名ユーザー'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  👤
                </div>
              )}
              <span className="text-sm text-gray-600">
                {project.profiles?.full_name || '匿名ユーザー'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <span>❤️</span>
              <span className="text-sm">{project.likes_count}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
