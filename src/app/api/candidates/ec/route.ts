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

// ── NepalVotes.live R2 CDN fallback ──
const NEPALVOTES_URL = 'https://pub-4173e04d0b78426caa8cfa525f827daa.r2.dev/constituencies.json'

const PROVINCE_STATE_MAP: Record<string, number> = {
    'Koshi': 1, 'Madhesh': 2, 'Bagmati': 3, 'Gandaki': 4,
    'Lumbini': 5, 'Karnali': 6, 'Sudurpashchim': 7,
}

interface NVCandidate {
    candidateId: number
    name: string
    nameNp: string
    partyName: string
    partyId: string
    votes: number
    gender: string
    isWinner: boolean
    fatherName?: string
    spouseName?: string
    qualification?: string
    institution?: string
    experience?: string
    address?: string
}

interface NVConstituency {
    province: string
    district: string
    districtNp: string
    code: string
    name: string
    nameNp: string
    status: string
    lastUpdated: string
    candidates: NVCandidate[]
    votesCast: number
    totalVoters: number
}

async function fetchFromNepalVotes(): Promise<ECCandidate[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
        const res = await fetch(NEPALVOTES_URL, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        })
        clearTimeout(timeout)
        if (!res.ok) throw new Error(`NepalVotes R2 returned ${res.status}`)
        const constituencies: NVConstituency[] = await res.json()
        if (!Array.isArray(constituencies) || constituencies.length === 0) {
            throw new Error('NepalVotes R2 returned empty data')
        }

        // Transform to ECCandidate format
        const candidates: ECCandidate[] = []
        for (const c of constituencies) {
            // Extract constituency number from name like "Kathmandu-3" → 3
            const constMatch = c.name.match(/-(\d+)$/)
            const constNum = constMatch ? parseInt(constMatch[1]) : 0
            const stateId = PROVINCE_STATE_MAP[c.province] || 0

            for (const cand of c.candidates) {
                candidates.push({
                    CandidateID: cand.candidateId,
                    CandidateName: cand.name || cand.nameNp,
                    AGE_YR: 0,
                    Gender: cand.gender === 'F' ? 'Female' : 'Male',
                    PoliticalPartyName: cand.partyName,
                    SYMBOLCODE: 0,
                    SymbolName: '',
                    CTZDIST: c.district,
                    DistrictName: c.district,
                    StateName: c.province,
                    STATE_ID: stateId,
                    SCConstID: constNum,
                    ConstName: constNum,
                    TotalVoteReceived: cand.votes || 0,
                    R: 0,
                    E_STATUS: c.status === 'COUNTING' ? 'Counting' : c.status === 'DECLARED' ? 'Declared' : null,
                    DOB: 0,
                    FATHER_NAME: cand.fatherName || '',
                    SPOUCE_NAME: cand.spouseName || '',
                    QUALIFICATION: cand.qualification || null,
                    NAMEOFINST: cand.institution || null,
                    EXPERIENCE: cand.experience || null,
                    OTHERDETAILS: null,
                    ADDRESS: cand.address || '',
                })
            }
        }
        console.log(`[NepalVotes] Loaded ${candidates.length} candidates from ${constituencies.length} constituencies`)
        return candidates
    } catch (err) {
        clearTimeout(timeout)
        console.warn('[NepalVotes] Failed to fetch:', err)
        throw err
    }
}

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
            fetchBestData()
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
        const data = await fetchBestData()
        cachedData = data
        cacheTimestamp = Date.now()
        return data
    } catch (err) {
        console.error('[EC API] All sources failed:', err)
        if (cachedData) return cachedData // Return any stale data as last resort
        return []
    }
}

/** Try EC ERIS first; if it has zero votes, try NepalVotes.live for live counts */
async function fetchBestData(): Promise<ECCandidate[]> {
    // Try EC ERIS first (official source)
    try {
        const ecData = await fetchFromEC()
        const hasVotes = ecData.some(c => c.TotalVoteReceived > 0)
        if (hasVotes) {
            console.log('[EC] Using official ERIS data (has vote counts)')
            return ecData
        }
        console.log('[EC] ERIS data has no votes, trying NepalVotes.live...')
    } catch (err) {
        console.warn('[EC] ERIS fetch failed, trying NepalVotes.live...', err)
    }

    // Fallback to NepalVotes.live
    try {
        const nvData = await fetchFromNepalVotes()
        if (nvData.length > 0) {
            console.log('[NepalVotes] Using NepalVotes.live data as primary source')
            return nvData
        }
    } catch (err) {
        console.warn('[NepalVotes] NepalVotes.live fetch also failed:', err)
    }

    // Last resort: try EC ERIS again even with zero votes
    return fetchFromEC()
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

    const hasNepalVotesData = allCandidates.some(c => c.E_STATUS === 'Counting' || c.E_STATUS === 'Declared')
    const response = NextResponse.json({
        status: 'ok',
        source: hasNepalVotesData ? 'nepalvotes.live' : 'result.election.gov.np',
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
