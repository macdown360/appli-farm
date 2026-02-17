import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import ProjectCard from '@/components/ProjectCard'

export default async function Home() {
  const supabase = await createClient()
  
  // ユーザーのログイン状態を確認
  const { data: { user } } = await supabase.auth.getUser()
  
  // ログイン状態に応じたリンク先を決定
  const ctaLink = user ? '/projects/new' : '/auth/signup'
  
  // 最新のプロジェクトを取得（8つに増やして4カラム×2行）
  const { data: recentProjects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(8)

  // カテゴリ別のプロジェクトを取得
  const categoryNames = [
    '営業・販売管理',
    'マーケティング支援',
    '文書作成・編集',
    'データ分析・可視化',
    'eラーニング',
    '自動化・効率化ツール',
  ]

  const categorySections = await Promise.all(
    categoryNames.map(async (category) => {
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .contains('categories', [category])
        .order('created_at', { ascending: false })
        .limit(4)
      
      return {
        name: category,
        projects: projects || []
      }
    })
  )

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <Navbar />
      
      {/* Hero Section - noteのようにシンプル */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            AIで作ったものを、<br className="md:hidden" />気軽にシェアしよう
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-8 leading-relaxed">
            AIやノーコードで作ったサイトやアプリを、<br className="hidden md:inline" />
            簡単に公開・共有できるプラットフォーム
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={ctaLink}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              はじめる
            </Link>
            <Link
              href="/projects"
              className="px-6 py-2.5 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              作品をみる
            </Link>
          </div>
        </div>
      </section>

      {/* Features - 3カラムのシンプルな説明 */}
      <section className="bg-white mt-2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">✏️</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">公開する</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                URLを共有するだけで簡単に作品を公開
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💬</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">反応をもらう</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                いいねやコメントでフィードバックを受け取れる
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">みつける</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                他の人の作品から刺激やヒントを得られる
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="mt-2 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">新着</h2>
            <Link
              href="/projects"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              もっとみる →
            </Link>
          </div>
          
          {recentProjects && recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-4">
                まだ作品が公開されていません
              </p>
              <Link
                href={ctaLink}
                className="text-emerald-500 hover:text-emerald-600 text-sm font-medium"
              >
                最初の作品を公開する →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Category Sections */}
      {categorySections.map((section) => (
        section.projects.length > 0 && (
          <section key={section.name} className="mt-2 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">{section.name}</h2>
                <Link
                  href={`/projects?category=${encodeURIComponent(section.name)}`}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  もっとみる →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {section.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>
        )
      ))}

      {/* CTA Section */}
      <section className="mt-2 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            あなたのアイデアが世界を変える！
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            ...かもしれない
          </p>
          <Link
            href={ctaLink}
            className="inline-block px-8 py-2.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            無料ではじめる
          </Link>
        </div>
      </section>
    </div>
  )
}
