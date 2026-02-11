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
    query = query.eq('category', params.category)
  }

  // 検索フィルター
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: projects } = await query

  // ユニークなカテゴリを取得
  const { data: categoriesData } = await supabase
    .from('projects')
    .select('category')
    .not('category', 'is', null)

  const categories = Array.from(
    new Set(categoriesData?.map((p) => p.category).filter(Boolean))
  )

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🌿 みんなの畑</h1>
        </div>

        {/* 検索とフィルター */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <form method="get" className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={params.search}
                placeholder="プロジェクト名や説明で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/projects"
                  className={`px-4 py-2 rounded-md ${
                    !params.category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/projects?category=${cat}`}
                    className={`px-4 py-2 rounded-md ${
                      params.category === cat
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              検索
            </button>
          </form>
        </div>

        {/* プロジェクト一覧 */}
        {projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-green-300">
            <p className="text-gray-500 text-lg mb-4">
              🌱 まだ何も植えられていません
            </p>
            <Link
              href="/projects/new"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              最初の種をまく
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
