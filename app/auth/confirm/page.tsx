'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth-errors'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ title: string; message: string; suggestion: string } | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // URLのハッシュからトークンを取得
        const hash = window.location.hash.substring(1)
        if (!hash) {
          setError({
            title: '確認トークンが見つかりません',
            message: 'メール内のリンクからアクセスしてください。',
            suggestion: '登録時に送信されたメール内のリンクをクリックしてください。リンクの有効期限は24時間です。',
          })
          setLoading(false)
          return
        }

        // トークンを処理
        const { error } = await supabase.auth.verifyOtp({
          token_hash: hash,
          type: 'email',
        })

        if (error) {
          throw error
        }

        setSuccess(true)
        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.message || 'メール確認に失敗しました')
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    confirmEmail()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="text-xl font-bold text-gray-900">AIで作ってみた件</span>
        </Link>
        <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
          メール確認
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 md:py-8 px-5 rounded-xl border border-gray-100 sm:px-10">
          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-gray-600">メールを確認中...</p>
            </div>
          )}

          {error && !loading && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-900 font-semibold text-sm mb-1">
                  {error.title}
                </p>
                <p className="text-red-700 text-sm mb-2">
                  {error.message}
                </p>
                <p className="text-red-600 text-xs bg-white rounded px-3 py-2">
                  💡 {error.suggestion}
                </p>
              </div>
              <Link
                href="/auth/signup"
                className="block w-full text-center py-2.5 px-4 rounded-full text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600"
              >
                もう一度登録する
              </Link>
            </div>
          )}

          {success && !loading && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm text-center">
                <p className="font-medium">メール確認が完了しました！</p>
                <p className="mt-2 text-xs">数秒後にホームページにリダイレクトします...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
