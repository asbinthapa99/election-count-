import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Safe fetch with timeout and error handling
async function safeFetch(url: string, timeoutMs = 8000) {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json, text/plain, */*' },
            next: { revalidate: 60 }, // Cache for 60s
        })
        clearTimeout(timeout)
        if (!res.ok) return null
        const text = await res.text()
        try { return JSON.parse(text) } catch { return text }
    } catch {
        return null
    }
}

// Data sources (ordered by priority — if one fails, try next)
const DATA_SOURCES = [
    {
        name: 'Election Commission Nepal (Official)',
        url: 'https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt',
        type: 'json',
    },
    {
        name: 'NepalVotes.live',
        url: 'https://nepalvotes.live/api/results',
        type: 'json',
    },
    {
        name: 'Ekantipur Election Portal',
        url: 'https://election.ekantipur.com/api/competitivearea',
        type: 'html',
    },
]

// GET: Scrape/fetch from Election Commission Nepal + Ekantipur and update database
// Called periodically by client-side polling every 60 seconds
export async function GET() {
    try {
        const supabase = createServerClient()
        const results: Record<string, unknown> = {}
        let primaryData = null

        // Try each data source in priority order
        for (const source of DATA_SOURCES) {
            const data = await safeFetch(source.url)
            if (data) {
                results[source.name] = {
                    status: 'available',
                    timestamp: new Date().toISOString(),
                }

                // Store snapshot in database
                try {
                    await supabase.from('results_snapshots').insert({
                        provider: source.name,
                        payload_json: typeof data === 'object' ? data : { raw: data },
                    })
                } catch { /* Ignore insert errors */ }

                if (!primaryData) primaryData = data // Use first successful source
            } else {
                results[source.name] = {
                    status: 'unavailable',
                    message: 'Source not responding or counting not started',
                }
            }
        }

        // If we got election data, parse it
        if (primaryData && Array.isArray(primaryData)) {
            // This is likely the EC Nepal JSON — array of candidates
            const totalCandidates = primaryData.length
            const parties = new Set(primaryData.map((c: Record<string, string>) => c.PARTY_NAME_ENG || c.party))
            const districts = new Set(primaryData.map((c: Record<string, string>) => c.DISTRICT_NAME_ENG || c.district))

            return NextResponse.json({
                status: 'data_available',
                message: 'Real election data fetched successfully',
                sources: results,
                timestamp: new Date().toISOString(),
                summary: {
                    totalCandidates,
                    totalParties: parties.size,
                    totalDistricts: districts.size,
                },
                // Return first 50 candidates as sample
                sampleCandidates: primaryData.slice(0, 50),
            })
        }

        // Fallback: Return DB state
        const { data: parties } = await supabase
            .from('parties')
            .select('*')
            .order('seats', { ascending: false })

        const { count: totalConstituencies } = await supabase
            .from('constituencies')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            status: 'waiting',
            message: 'Election counting has not started yet. Live results will appear here automatically on election day (Falgun 21, 2082 / March 5, 2026).',
            sources: results,
            timestamp: new Date().toISOString(),
            parties: parties || [],
            totalConstituencies: totalConstituencies || 0,
            nextElection: '2026-03-05T06:00:00+05:45',
        })
    } catch (err) {
        console.error('Scraper error:', err)
        return NextResponse.json({
            status: 'error',
            message: 'Unable to fetch election data. Will retry automatically.',
            timestamp: new Date().toISOString(),
        })
    }
}
