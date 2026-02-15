'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [searchParams])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/projects?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/projects')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center gap-4">
          {/* ロゴ */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-900">AIで作ってみた件</span>
          </Link>

          {/* 検索窓 (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="プロジェクトを検索..."
                className="w-full px-4 py-1.5 pl-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                pathname === '/'
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ホーム
            </Link>

            <div className="w-px h-5 bg-gray-200 mx-2" />

            {user ? (
              <>
                <Link
                  href="/projects/new"
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  公開
                </Link>
                <Link
                  href="/profile"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  マイページ
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100">
            {/* 検索窓 (Mobile) */}
            <form onSubmit={handleSearch} className="px-3 pt-3 pb-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="プロジェクトを検索..."
                  className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
            <div className="space-y-1 pt-2">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-sm ${
                  pathname === '/' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
                onClick={() => setIsOpen(false)}
              >
                ホーム
              </Link>
            </div>
            <div className="space-y-1 border-t border-gray-100 pt-2 mt-2">
              {user ? (
                <>
                  <Link
                    href="/projects/new"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-emerald-600"
                    onClick={() => setIsOpen(false)}
                  >
                    公開
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-sm text-gray-500"
                    onClick={() => setIsOpen(false)}
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsOpen(false) }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 rounded-md text-sm text-gray-500"
                    onClick={() => setIsOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-emerald-600"
                    onClick={() => setIsOpen(false)}
                  >
                    新規登録
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
