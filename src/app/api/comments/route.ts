import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET: List comments (with replies)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const electionId = searchParams.get('election_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerClient()

    let query = supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (electionId) {
        query = query.eq('election_id', electionId)
    }

    const { data: comments, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch replies for these comments
    if (comments && comments.length > 0) {
        const commentIds = comments.map((c) => c.id)
        const { data: replies } = await supabase
            .from('comments')
            .select('*')
            .in('parent_id', commentIds)
            .order('created_at', { ascending: true })

        // Attach replies to parent comments
        const repliesMap: Record<string, any[]> = {}
        for (const reply of replies || []) {
            if (!repliesMap[reply.parent_id]) {
                repliesMap[reply.parent_id] = []
            }
            repliesMap[reply.parent_id].push(reply)
        }

        for (const comment of comments) {
            ; (comment as any).replies = repliesMap[comment.id] || []
        }
    }

    return NextResponse.json({ comments, total: count })
}

// POST: Create a comment
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { election_id, anon_id, content, parent_id } = body

    // Validation
    if (!anon_id || !content) {
        return NextResponse.json({ error: 'anon_id and content required' }, { status: 400 })
    }

    if (content.length > 500) {
        return NextResponse.json({ error: 'Content too long (max 500 chars)' }, { status: 400 })
    }

    if (content.trim().length < 2) {
        return NextResponse.json({ error: 'Content too short' }, { status: 400 })
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(anon_id)) {
        return NextResponse.json({ error: 'Invalid anon_id' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Server-side rate limit: check last comment from this anon_id
    const { data: recent } = await supabase
        .from('comments')
        .select('created_at')
        .eq('anon_id', anon_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (recent) {
        const lastTime = new Date(recent.created_at).getTime()
        const now = Date.now()
        if (now - lastTime < 15000) {
            return NextResponse.json(
                { error: 'Rate limited. Wait 15 seconds between comments.' },
                { status: 429 }
            )
        }
    }

    // Duplicate detection: check for same content from same anon_id in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: dup } = await supabase
        .from('comments')
        .select('id')
        .eq('anon_id', anon_id)
        .eq('content', content.trim())
        .gte('created_at', fiveMinAgo)
        .maybeSingle()

    if (dup) {
        return NextResponse.json({ error: 'Duplicate comment detected' }, { status: 409 })
    }

    // Insert comment
    const insertData: any = {
        anon_id,
        content: content.trim(),
    }
    if (election_id) insertData.election_id = election_id
    if (parent_id) insertData.parent_id = parent_id

    const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
