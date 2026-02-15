import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 mt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* ブランド */}
          <div>
            <Link href="/" className="inline-block mb-3">
              <span className="text-base font-bold text-gray-900">AIで作ってみた件</span>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed">
              AIで作ったサイトやアプリを
              <br />
              手軽に公開・共有できるプラットフォーム
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-xs">リンク</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">
                  さがす
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          {/* ポリシー */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-xs">ポリシー</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">
                  個人情報保護方針
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-center text-gray-300 text-xs">
            © {currentYear} AIで作ってみた件
          </p>
        </div>
      </div>
    </footer>
  )
}
