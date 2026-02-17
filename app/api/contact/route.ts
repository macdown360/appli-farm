import { NextRequest, NextResponse } from 'next/server'

interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactMessage = await request.json()

    // バリデーション
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    // メールアドレスのバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // メール送信処理
    // Resendを使用する場合
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'contact@applifarm.jp',
            to: 'macdown360@gmail.com',
            reply_to: body.email,
            subject: `【AIで作ってみた件 お問い合わせ】${body.subject}`,
            html: `
              <h2>新しいお問い合わせがあります</h2>
              <p><strong>お名前:</strong> ${escapeHtml(body.name)}</p>
              <p><strong>メールアドレス:</strong> ${escapeHtml(body.email)}</p>
              <p><strong>件名:</strong> ${escapeHtml(body.subject)}</p>
              <p><strong>メッセージ:</strong></p>
              <pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(body.message)}</pre>
            `,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Resend API error:', error)
          throw new Error('メール送信に失敗しました')
        }

        return NextResponse.json(
          { success: true, message: 'お問い合わせを送信しました' },
          { status: 200 }
        )
      } catch (error) {
        console.error('Resend error:', error)
        throw error
      }
    }

    // Resendが設定されていない場合のフォールバック
    console.log('Contact form submission (no email service configured):', {
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'お問い合わせを受け付けました。管理者が確認いたします。',
        note: 'メール通知は設定されていません。ログをご確認ください。'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: '送信に失敗しました。もう一度お試しください。' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
