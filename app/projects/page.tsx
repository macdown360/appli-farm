import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import ProjectCard from '@/components/ProjectCard'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // プロジェクトを取得
  let query = supabase
    .from('projects')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  // カテゴリフィルター
  if (params.category) {
    query = query.contains('categories', [params.category])
  }

  // 検索フィルター
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: projects } = await query

  // ユニークなカテゴリを取得
  const { data: categoriesData } = await supabase
    .from('projects')
    .select('categories')

  const categories = Array.from(
    new Set(
      (categoriesData ?? [])
        .flatMap((p) => p.categories || [])
        .filter(Boolean)
    )
  )

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <Navbar />

      <div className="max-w-5xl mx-auto py-8 md:py-10 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">さがす</h1>
        </div>

        {/* 検索とフィルター */}
        <div className="mb-6 bg-white p-4 md:p-5 rounded-xl border border-gray-100">
          <form method="get" className="space-y-4">
            <div>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={params.search}
                placeholder="キーワードで検索..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none"
              />
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/projects"
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    !params.category
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/projects?category=${cat}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      params.category === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              検索
            </button>
          </form>
        </div>

        {/* プロジェクト一覧 */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">
              まだ作品が投稿されていません
            </p>
            <Link
              href="/projects/new"
              className="text-emerald-500 hover:text-emerald-600 text-sm font-medium"
            >
              最初の作品を投稿する →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
