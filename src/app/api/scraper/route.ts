import { NextResponse } from 'next/server'

// ── Multiple data source fetcher ──
// Aggregates live election data from multiple Nepali news/election portals

interface OnlineKhabarParty {
    party_id: number
    party_name: string
    party_nickname: string
    party_slug: string
    party_image: string
    party_color: string
    party_order: number
    leading_count: number
    winner_count: number
    total_seat: number
}

interface DataSourceResult {
    name: string
    status: 'available' | 'unavailable'
    timestamp: string
    message?: string
    data?: unknown
}

// Safe fetch with timeout
async function safeFetch(url: string, timeoutMs = 8000) {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json, text/plain, */*' },
            cache: 'no-store',
        })
        clearTimeout(timeout)
        if (!res.ok) return null
        const text = await res.text()
        try { return JSON.parse(text) } catch { return text }
    } catch {
        return null
    }
}

// ── In-memory cache ──
let cachedResponse: Record<string, unknown> | null = null
let cacheTime = 0
const CACHE_TTL = 30_000 // 30s

export async function GET() {
    const now = Date.now()
    if (cachedResponse && (now - cacheTime) < CACHE_TTL) {
        return NextResponse.json(cachedResponse, {
            headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=30' },
        })
    }

    const sources: DataSourceResult[] = []

    // 1. NepalVotes.live R2 CDN — per-candidate vote data
    let nepalVotesData = null
    try {
        const nvData = await safeFetch('https://pub-4173e04d0b78426caa8cfa525f827daa.r2.dev/constituencies.json', 10000)
        if (nvData && Array.isArray(nvData) && nvData.length > 0) {
            const counting = nvData.filter((c: { status: string }) => c.status === 'COUNTING' || c.status === 'DECLARED')
            const totalVotes = nvData.reduce((sum: number, c: { votesCast?: number }) => sum + (c.votesCast || 0), 0)
            nepalVotesData = {
                totalConstituencies: nvData.length,
                countingConstituencies: counting.length,
                totalVotes,
                constituencies: nvData,
            }
            sources.push({
                name: 'NepalVotes.live',
                status: 'available',
                timestamp: new Date().toISOString(),
            })
        } else {
            sources.push({ name: 'NepalVotes.live', status: 'unavailable', timestamp: new Date().toISOString(), message: 'No data' })
        }
    } catch {
        sources.push({ name: 'NepalVotes.live', status: 'unavailable', timestamp: new Date().toISOString(), message: 'Fetch failed' })
    }

    // 2. OnlineKhabar — party seat counts (leading/winner)
    let onlineKhabarData = null
    try {
        const okData = await safeFetch('https://election.onlinekhabar.com/wp-json/okelapi/v1/2082/home/election-results?limit=200')
        if (okData?.data?.party_results && Array.isArray(okData.data.party_results)) {
            const parties: OnlineKhabarParty[] = okData.data.party_results
            const withSeats = parties.filter(p => p.leading_count > 0 || p.winner_count > 0)
            const totalLeading = parties.reduce((s, p) => s + p.leading_count, 0)
            const totalWinners = parties.reduce((s, p) => s + p.winner_count, 0)
            onlineKhabarData = {
                totalParties: parties.length,
                partiesWithSeats: withSeats.length,
                totalLeading,
                totalWinners,
                parties: withSeats.map(p => ({
                    name: p.party_name,
                    nickname: p.party_nickname,
                    slug: p.party_slug,
                    color: p.party_color,
                    image: p.party_image,
                    leading: p.leading_count,
                    won: p.winner_count,
                    totalSeats: p.total_seat,
                })),
            }
            sources.push({
                name: 'OnlineKhabar',
                status: 'available',
                timestamp: new Date().toISOString(),
            })
        } else {
            sources.push({ name: 'OnlineKhabar', status: 'unavailable', timestamp: new Date().toISOString(), message: 'No data' })
        }
    } catch {
        sources.push({ name: 'OnlineKhabar', status: 'unavailable', timestamp: new Date().toISOString(), message: 'Fetch failed' })
    }

    // 3. Election Commission Nepal
    let ecData = null
    try {
        const ec = await safeFetch('https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt', 10000)
        if (ec && Array.isArray(ec) && ec.length > 0) {
            const totalVotes = ec.reduce((s: number, c: { TotalVoteReceived?: number }) => s + (c.TotalVoteReceived || 0), 0)
            ecData = {
                totalCandidates: ec.length,
                totalVotes,
                hasVotes: totalVotes > 0,
            }
            sources.push({ name: 'Election Commission Nepal', status: 'available', timestamp: new Date().toISOString() })
        } else {
            sources.push({ name: 'Election Commission Nepal', status: 'unavailable', timestamp: new Date().toISOString(), message: 'No data or counting not started' })
        }
    } catch {
        sources.push({ name: 'Election Commission Nepal', status: 'unavailable', timestamp: new Date().toISOString(), message: 'Fetch failed' })
    }

    const response = {
        status: 'data_available',
        message: `Live election data from ${sources.filter(s => s.status === 'available').length} of ${sources.length} sources`,
        timestamp: new Date().toISOString(),
        sources,
        nepalVotes: nepalVotesData,
        onlineKhabar: onlineKhabarData,
        electionCommission: ecData,
    }

    cachedResponse = response
    cacheTime = Date.now()

    return NextResponse.json(response, {
        headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=30' },
    })
}
