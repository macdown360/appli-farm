import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, content } = body

    if (!project_id || !content || !content.trim()) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    if (content.trim().length > 50) {
      return NextResponse.json(
        { error: '改善履歴は50文字以内で入力してください' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      )
    }

    // プロジェクトの所有者を確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      console.error('Failed to fetch project:', projectError)
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'このプロジェクトの改善履歴を追加する権限がありません' },
        { status: 403 }
      )
    }

    // 改善履歴を追加
    const { data, error } = await supabase
      .from('project_updates')
      .insert({
        project_id,
        content: content.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting project update:', error)
      return NextResponse.json(
        { error: `改善履歴の追加に失敗しました: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `リクエスト処理中にエラーが発生しました: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const updateId = searchParams.get('id')

    if (!updateId) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      )
    }

    // 改善履歴が存在し、プロジェクトの所有者が削除を試みているか確認
    const { data: update } = await supabase
      .from('project_updates')
      .select('project_id')
      .eq('id', updateId)
      .single()

    if (!update) {
      return NextResponse.json(
        { error: '改善履歴が見つかりません' },
        { status: 404 }
      )
    }

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', update.project_id)
      .single()

    if (project?.user_id !== user.id) {
      return NextResponse.json(
        { error: '削除する権限がありません' },
        { status: 403 }
      )
    }

    // 改善履歴を削除
    const { error: deleteError } = await supabase
      .from('project_updates')
      .delete()
      .eq('id', updateId)

    if (deleteError) {
      console.error('Error deleting project update:', deleteError)
      return NextResponse.json(
        { error: '改善履歴の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'リクエスト処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
