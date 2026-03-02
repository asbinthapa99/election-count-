import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// POST: Like or unlike a comment (toggle)
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { comment_id, anon_id } = body

    if (!comment_id || !anon_id) {
        return NextResponse.json({ error: 'comment_id and anon_id required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if already liked
    const { data: existing } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment_id)
        .eq('anon_id', anon_id)
        .maybeSingle()

    if (existing) {
        // Unlike: remove the like
        await supabase.from('comment_likes').delete().eq('id', existing.id)

        // Decrement likes_count on the comment
        const { data: comment } = await supabase
            .from('comments')
            .select('likes_count')
            .eq('id', comment_id)
            .single()

        if (comment) {
            await supabase
                .from('comments')
                .update({ likes_count: Math.max(0, (comment.likes_count || 1) - 1) })
                .eq('id', comment_id)
        }

        return NextResponse.json({ liked: false })
    } else {
        // Like: add a new like
        const { error } = await supabase
            .from('comment_likes')
            .insert({ comment_id, anon_id })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Increment likes_count on the comment
        const { data: comment } = await supabase
            .from('comments')
            .select('likes_count')
            .eq('id', comment_id)
            .single()

        if (comment) {
            await supabase
                .from('comments')
                .update({ likes_count: (comment.likes_count || 0) + 1 })
                .eq('id', comment_id)
        }

        return NextResponse.json({ liked: true }, { status: 201 })
    }
}
