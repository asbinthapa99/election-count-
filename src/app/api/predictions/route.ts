import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET: Get prediction counts for an election
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const electionId = searchParams.get('election_id')
    const anonId = searchParams.get('anon_id')

    if (!electionId) {
        return NextResponse.json({ error: 'election_id required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get aggregate counts per party
    const { data: predictions, error } = await supabase
        .from('predictions')
        .select(`
      party_id,
      party:parties(name_en, abbreviation, color)
    `)
        .eq('election_id', electionId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate votes per party
    const counts: Record<string, { count: number; party: any }> = {}
    for (const p of predictions || []) {
        if (!counts[p.party_id]) {
            counts[p.party_id] = { count: 0, party: p.party }
        }
        counts[p.party_id].count++
    }

    // Check if this anon_id already voted
    let userVote = null
    if (anonId) {
        const { data: existing } = await supabase
            .from('predictions')
            .select('party_id')
            .eq('election_id', electionId)
            .eq('anon_id', anonId)
            .maybeSingle()
        userVote = existing?.party_id || null
    }

    return NextResponse.json({
        counts,
        totalVotes: predictions?.length || 0,
        userVote,
    })
}

// POST: Cast a prediction vote
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { election_id, party_id, anon_id } = body

    if (!election_id || !party_id || !anon_id) {
        return NextResponse.json(
            { error: 'election_id, party_id, and anon_id are required' },
            { status: 400 }
        )
    }

    // Validate anon_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(anon_id)) {
        return NextResponse.json({ error: 'Invalid anon_id format' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if already voted (enforced by DB unique constraint too)
    const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('election_id', election_id)
        .eq('anon_id', anon_id)
        .maybeSingle()

    if (existing) {
        return NextResponse.json({ error: 'Already voted for this election' }, { status: 409 })
    }

    // Insert prediction
    const { data, error } = await supabase
        .from('predictions')
        .insert({ election_id, party_id, anon_id })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Already voted' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
