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
  
  // 最新のプロジェクトを取得
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 hidden sm:block">
          <div className="absolute top-10 left-10 text-6xl md:text-8xl">🌱</div>
          <div className="absolute top-20 right-20 text-5xl md:text-6xl">🌻</div>
          <div className="absolute bottom-10 left-1/4 text-5xl md:text-7xl">🌿</div>
          <div className="absolute bottom-20 right-1/3 text-4xl md:text-5xl">🐝</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            アプリを作って、公開して、育てる
          </h1>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-green-100">
            自分が作ったWEBサイトやアプリを公開して、利用者からのフィードバックを受けながら一緒に育てていくプラットフォーム
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4">
            <Link
              href={ctaLink}
              className="px-6 md:px-8 py-2 md:py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm md:text-base"
            >
              無料で種をまく 🌱
            </Link>
            <Link
              href="/projects"
              className="px-6 md:px-8 py-2 md:py-3 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-900 transition-colors border border-green-500 text-sm md:text-base"
            >
              畑を見にいく
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-900">
            Appli Farmの特徴
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-4 md:p-6 bg-green-50 rounded-xl">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-green-800">種をまく</h3>
              <p className="text-sm md:text-base text-gray-600">
                タイトル、説明、URLを入力するだけで簡単にアプリを公開。あなたのアイデアの種を植えましょう
              </p>
            </div>
            <div className="text-center p-4 md:p-6 bg-amber-50 rounded-xl">
              <div className="text-4xl mb-4">💧</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-amber-800">水をやる</h3>
              <p className="text-sm md:text-base text-gray-600">
                利用者からのフィードバックやいいねが、あなたのアプリを成長させる栄養になります
              </p>
            </div>
            <div className="text-center p-4 md:p-6 bg-green-50 rounded-xl">
              <div className="text-4xl mb-4">🌳</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-green-800">一緒に育てる</h3>
              <p className="text-sm md:text-base text-gray-600">
                みんなの声を聞きながらアプリを改善。小さな芽が大きな木に育ちます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects Section */}
      <section className="py-12 md:py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">🌿 最近植えられたアプリ</h2>
            <Link
              href="/projects"
              className="text-green-600 hover:text-green-700 font-medium text-sm md:text-base whitespace-nowrap"
            >
              すべて見る →
            </Link>
          </div>
          
          {projects && projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-green-300">
              <p className="text-gray-500 text-lg mb-4">
                🌱 まだ畑には何も植えられていません
              </p>
              <Link
                href={ctaLink}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                最初の種をまきませんか？
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            あなたのアイデアが世界を変える。アプリの種を育てよう！
          </h2>
          <p className="text-xl mb-8 text-green-100">
            無料で始められます。今すぐ登録して、みんなと一緒にアプリを育てましょう！
          </p>
          <Link
            href={ctaLink}
            className="inline-block px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            今すぐ始める 🌱
          </Link>
        </div>
      </section>
    </div>
  )
}
