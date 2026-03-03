import { NextResponse } from 'next/server'

export interface ECCandidate {
    CandidateID: number
    CandidateName: string
    AGE_YR: number
    Gender: string
    PoliticalPartyName: string
    SYMBOLCODE: number
    SymbolName: string
    CTZDIST: number | string
    DistrictName: string
    StateName: string
    STATE_ID: number
    SCConstID: number
    ConstName: number
    TotalVoteReceived: number
    R: number
    E_STATUS: string | null
    DOB: number
    FATHER_NAME: string
    SPOUCE_NAME: string
    QUALIFICATION: string | null
    NAMEOFINST: string | null
    EXPERIENCE: string | null
    OTHERDETAILS: string | null
    ADDRESS: string
}

// ── Server-side in-memory cache with stale-while-revalidate ──
let cachedData: ECCandidate[] | null = null
let cacheTimestamp = 0
const CACHE_FRESH = 30_000      // Fresh for 30s (matches client polling)
const CACHE_STALE_MAX = 300_000 // Serve stale for up to 5 min while revalidating
let isRevalidating = false

// ERIS export URLs — try 2082-specific first, then generic fallback
const ERIS_URLS = [
    'https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt',
    'https://result.election.gov.np/JSONFiles/ElectionResultCentral.txt',
]

async function fetchFromEC(): Promise<ECCandidate[]> {
    for (const url of ERIS_URLS) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'ElectionNepal-Dashboard/1.0',
                },
                cache: 'no-store',
            })
            clearTimeout(timeout)
            if (!res.ok) {
                console.warn(`[EC] ${url} returned ${res.status}, trying next...`)
                continue
            }
            const text = await res.text()
            const cleanText = text.replace(/^\uFEFF/, '') // Remove BOM
            const data = JSON.parse(cleanText)
            if (Array.isArray(data) && data.length > 0) {
                console.log(`[EC] Loaded ${data.length} candidates from ${url}`)
                return data
            }
        } catch (err) {
            clearTimeout(timeout)
            console.warn(`[EC] Failed to fetch ${url}:`, err)
            continue
        }
    }
    throw new Error('All ERIS URLs failed')
}

async function getECData(): Promise<ECCandidate[]> {
    const now = Date.now()
    const age = now - cacheTimestamp

    // Fresh cache — return immediately
    if (cachedData && age < CACHE_FRESH) {
        return cachedData
    }

    // Stale cache — return stale data but trigger background revalidation
    if (cachedData && age < CACHE_STALE_MAX) {
        if (!isRevalidating) {
            isRevalidating = true
            fetchFromEC()
                .then(data => {
                    cachedData = data
                    cacheTimestamp = Date.now()
                })
                .catch(err => console.error('[EC Cache] Background revalidation failed:', err))
                .finally(() => { isRevalidating = false })
        }
        return cachedData
    }

    // No cache or expired — must fetch
    try {
        const data = await fetchFromEC()
        cachedData = data
        cacheTimestamp = Date.now()
        return data
    } catch (err) {
        console.error('[EC API] Fetch failed:', err)
        if (cachedData) return cachedData // Return any stale data as last resort
        return []
    }
}

// ── GET Handler ──
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const state = searchParams.get('state') || searchParams.get('province')
    const constId = searchParams.get('constituency')
    const party = searchParams.get('party')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 10000) // Cap at 10k

    const allCandidates = await getECData()

    if (allCandidates.length === 0) {
        return NextResponse.json({
            status: 'unavailable',
            message: 'Election Commission data not available. Counting may not have started.',
            timestamp: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
            }
        })
    }

    // Apply filters
    let filtered = allCandidates

    if (district) {
        filtered = filtered.filter(c => c.DistrictName === district || c.CTZDIST.toString() === district)
    }
    if (state) {
        filtered = filtered.filter(c => c.StateName === state || c.STATE_ID.toString() === state)
    }
    if (constId) {
        filtered = filtered.filter(c => c.SCConstID.toString() === constId || c.ConstName.toString() === constId)
    }
    if (party) {
        filtered = filtered.filter(c => c.PoliticalPartyName.includes(party))
    }
    if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(c =>
            c.CandidateName.toLowerCase().includes(q) ||
            c.DistrictName.toLowerCase().includes(q) ||
            c.PoliticalPartyName.toLowerCase().includes(q) ||
            (c.ADDRESS && c.ADDRESS.toLowerCase().includes(q))
        )
    }

    // Extract unique values for filter dropdowns
    const uniqueDistricts = [...new Set(allCandidates.map(c => c.DistrictName))].sort()
    const uniqueProvinces = [...new Set(allCandidates.map(c => c.StateName))]
    const uniqueParties = [...new Set(allCandidates.map(c => c.PoliticalPartyName))].sort()

    // Pagination
    const total = filtered.length
    const startIdx = (page - 1) * limit
    const paginated = filtered.slice(startIdx, startIdx + limit)

    // Vote summary
    const totalVotes = allCandidates.reduce((sum, c) => sum + (c.TotalVoteReceived || 0), 0)

    const response = NextResponse.json({
        status: 'ok',
        source: 'result.election.gov.np',
        timestamp: new Date().toISOString(),
        cacheAge: cachedData ? Date.now() - cacheTimestamp : 0,
        summary: {
            totalCandidates: allCandidates.length,
            totalVotes,
            totalDistricts: uniqueDistricts.length,
            totalProvinces: uniqueProvinces.length,
            totalParties: uniqueParties.length,
            filteredCount: total,
        },
        filters: {
            districts: uniqueDistricts,
            provinces: uniqueProvinces,
            parties: uniqueParties,
        },
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        candidates: paginated,
    })

    // Set cache headers for CDN/browser
    response.headers.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')

    return response
}
