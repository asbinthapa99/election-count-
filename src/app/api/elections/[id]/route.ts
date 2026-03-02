import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServerClient()

    // Get election + party results with party info
    const [electionRes, resultsRes] = await Promise.all([
        supabase.from('elections').select('*').eq('id', id).single(),
        supabase
            .from('party_results')
            .select(`
        *,
        party:parties(*)
      `)
            .eq('election_id', id)
            .order('seats', { ascending: false }),
    ])

    if (electionRes.error) {
        return NextResponse.json({ error: electionRes.error.message }, { status: 404 })
    }

    // Calculate dashboard stats
    const totalVotes = (resultsRes.data || []).reduce((sum, r) => sum + (r.votes || 0), 0)
    const totalSeats = (resultsRes.data || []).reduce((sum, r) => sum + (r.seats || 0), 0)

    return NextResponse.json({
        election: electionRes.data,
        results: resultsRes.data || [],
        stats: {
            totalVotes,
            totalSeats,
            voterTurnout: electionRes.data.counted && electionRes.data.total_constituencies
                ? ((electionRes.data.counted / electionRes.data.total_constituencies) * 100).toFixed(1)
                : 0,
            constituenciesDecided: electionRes.data.counted || 0,
            totalConstituencies: electionRes.data.total_constituencies || 0,
        },
    })
}
