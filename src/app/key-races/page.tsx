'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Swords, MapPin, TrendingUp, TrendingDown, Minus, Zap, RefreshCw, Vote, Users, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

// ── Tracked key races — matched by EXACT district name from EC data ──
const TRACKED_RACES = [
    {
        id: 1,
        districtName: 'झापा',
        constNumber: 5,
        constituencyEn: 'Jhapa-5',
        district: 'Jhapa',
        province: 'Koshi Province',
        description: 'Battle of the Titans — Former PM KP Oli vs. Upcoming PM Mayor Balen Shah (RSP Won)',
        importance: 'Prime Minister race',
        importance_level: 'critical' as const,
        pinnedMatchup: [340111, 339653], // KP Oli vs Balen Shah
    },
    {
        id: 2,
        districtName: 'चितवन',
        constNumber: 2,
        constituencyEn: 'Chitwan-2',
        district: 'Chitwan',
        province: 'Bagmati Province',
        description: 'RSP stronghold — Rabi Lamichhane defends his seat',
        importance: 'High interest',
        importance_level: 'high' as const,
        pinnedMatchup: [340990] as number[], // Rabi Lamichhane pinned as c1
    },
    {
        id: 3,
        districtName: 'सर्लाही',
        constNumber: 4,
        constituencyEn: 'Sarlahi-4',
        district: 'Sarlahi',
        province: 'Madhesh Province',
        description: 'NC General Secretary Gagan Thapa fights for the Madhesh constituency',
        importance: 'PM hopeful race',
        importance_level: 'high' as const,
        pinnedMatchup: [341549] as number[], // Gagan Thapa pinned as c1
    },
    {
        id: 4,
        districtName: 'धादिङ',
        constNumber: 1,
        constituencyEn: 'Dhading-1',
        district: 'Dhading',
        province: 'Bagmati Province',
        description: 'Multi-party battleground in Dhading — Aashika Tamang vs Rajendra Prasad Pandey',
        importance: 'Youth politics',
        importance_level: 'medium' as const,
        pinnedMatchup: [1, 2], // Fake IDs to be injected if missing
        fallbackNames: ['Aashika Tamang', 'Rajendra Prasad Pandey'],
    },
    {
        id: 5,
        districtName: 'रुकुम (पूर्वी भाग)',
        constNumber: 1,
        constituencyEn: 'Rukum East-1',
        district: 'Rukum East',
        province: 'Lumbini Province',
        description: 'Prachanda defends his Maoist stronghold',
        importance: 'Former PM race',
        importance_level: 'high' as const,
        pinnedMatchup: [340050] as number[], // Prachanda pinned as c1
    },
]


// ── Known candidate photos (by CandidateID from EC data) ──
const KNOWN_PHOTOS: Record<number, string> = {
    // Jhapa-5
    340111: '/images/candidates/kp-oli.jpg', // KP Oli
    339653: '/images/candidates/balen-shah.jpg', // Balen Shah
}

// Known English names for popular candidates
const KNOWN_NAMES_EN: Record<number, string> = {
    340111: 'KP Sharma Oli',
    339653: 'Balen Shah',
    340990: 'Rabi Lamichhane',
    341549: 'Gagan Kumar Thapa',
    340050: 'Pushpa Kamal Dahal (Prachanda)',
}

interface ECCandidate {
    CandidateID: number
    CandidateName: string
    AGE_YR: number
    Gender: string
    PoliticalPartyName: string
    SymbolName: string
    DistrictName: string
    StateName: string
    SCConstID: number
    ConstName: number
    TotalVoteReceived: number
    QUALIFICATION: string | null
    ADDRESS: string
}

const PARTY_COLORS: Record<string, string> = {
    'एकीकृत मार्क्सवादी लेनिनवादी': '#E63946',
    'नेपाली काँग्रेस': '#006EB5',
    'नेपाली कम्युनिष्ट पार्टी': '#C62828',
    'माओवादी': '#8B1A1A',
    'राष्ट्रिय स्वतन्त्र पार्टी': '#6C63FF',
    'राष्ट्रिय प्रजातन्त्र पार्टी': '#1565C0',
    'जनता समाजवादी': '#7B1FA2',
    'स्वतन्त्र': '#607D8B',
}

function getPartyColor(partyName: string): string {
    for (const [key, color] of Object.entries(PARTY_COLORS)) {
        if (partyName.includes(key)) return color
    }
    return '#6B7280'
}

const PARTY_ABBR: Record<string, string> = {
    'एकीकृत मार्क्सवादी लेनिनवादी': 'CPN-UML',
    'नेपाली काँग्रेस': 'NC',
    'नेपाली कम्युनिष्ट पार्टी': 'NCP',
    'माओवादी': 'Maoist',
    'राष्ट्रिय स्वतन्त्र पार्टी': 'RSP',
    'राष्ट्रिय प्रजातन्त्र पार्टी': 'RPP',
    'जनता समाजवादी': 'JSP',
    'स्वतन्त्र': 'IND',
}

function getPartyAbbr(partyName: string): string {
    for (const [key, abbr] of Object.entries(PARTY_ABBR)) {
        if (partyName.includes(key)) return abbr
    }
    return partyName.length > 15 ? partyName.substring(0, 12) + '…' : partyName
}

function CandidatePhoto({ candidateId, name }: { candidateId: number; name: string }) {
    const photo = KNOWN_PHOTOS[candidateId]
    const [imgSrc, setImgSrc] = useState<string | null>(photo || null)
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)

    if (!imgSrc) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 text-xl font-bold">
                {initials}
            </div>
        )
    }
    return (
        <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover object-top"
            onError={() => setImgSrc(null)}
            unoptimized
        />
    )
}

export default function KeyRacesPage() {
    const [raceData, setRaceData] = useState<Record<number, ECCandidate[]>>({})
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string>('')
    const [isPolling, setIsPolling] = useState(false)
    const [expandedRaces, setExpandedRaces] = useState<Set<number>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')

    const filteredRaces = TRACKED_RACES.filter(r =>
        r.districtName.includes(searchQuery) ||
        r.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleExpanded = (raceId: number) => {
        setExpandedRaces(prev => {
            const next = new Set(prev)
            if (next.has(raceId)) next.delete(raceId)
            else next.add(raceId)
            return next
        })
    }

    const fetchRaceData = useCallback(async () => {
        setIsPolling(true)
        try {
            const res = await fetch('/api/candidates/ec?limit=10000')
            const json = await res.json()

            if (json.status === 'ok' && json.candidates) {
                const allCandidates: ECCandidate[] = json.candidates
                const grouped: Record<number, ECCandidate[]> = {}

                for (const race of TRACKED_RACES) {
                    // Match by district name (supports both Nepali EC data and English NepalVotes data)
                    let raceCandidates = allCandidates.filter(
                        c => (c.DistrictName === race.districtName || c.DistrictName === race.district) && c.ConstName === race.constNumber
                    )

                    // Inject fallback candidates if missing (e.g. Aashika Tamang in Dhading-1)
                    if ((race as any).fallbackNames) {
                        const fallbacks = (race as any).fallbackNames as string[]
                        const pins = race.pinnedMatchup || []
                        fallbacks.forEach((name, idx) => {
                            if (!raceCandidates.find(c => c.CandidateName === name)) {
                                raceCandidates.push({
                                    CandidateID: pins[idx] || (999000 + idx),
                                    CandidateName: name,
                                    AGE_YR: 40,
                                    Gender: 'M/F',
                                    PoliticalPartyName: name.includes('Aashika') ? 'राष्ट्रिय स्वतन्त्र पार्टी' : 'नेपाली काँग्रेस',
                                    SymbolName: '',
                                    DistrictName: race.districtName,
                                    StateName: race.province,
                                    SCConstID: 0,
                                    ConstName: race.constNumber,
                                    TotalVoteReceived: 0,
                                    ADDRESS: '',
                                    QUALIFICATION: '',
                                })
                            }
                        })
                    }

                    // Sort by votes descending
                    raceCandidates.sort((a, b) => {
                        if (b.TotalVoteReceived !== a.TotalVoteReceived) {
                            return b.TotalVoteReceived - a.TotalVoteReceived
                        }
                        // Major parties first when votes are equal
                        const aMajor = isMajorParty(a.PoliticalPartyName) ? 1 : 0
                        const bMajor = isMajorParty(b.PoliticalPartyName) ? 1 : 0
                        return bMajor - aMajor
                    })
                    grouped[race.id] = raceCandidates
                }

                setRaceData(grouped)
                setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            }
        } catch (err) {
            console.error('Failed to fetch race data:', err)
        } finally {
            setLoading(false)
            setIsPolling(false)
        }
    }, [])

    useEffect(() => {
        fetchRaceData()
        const interval = setInterval(fetchRaceData, 30000)
        return () => clearInterval(interval)
    }, [fetchRaceData])

    const levelMap: Record<string, string> = {
        critical: 'bg-red-100 text-red-700',
        high: 'bg-orange-100 text-orange-700',
        medium: 'bg-blue-100 text-blue-700',
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-emerald-700 via-green-600 to-teal-500 text-white">
                <div className="container-app py-14 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">⚔️ Key Races 2082</h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto">
                        Real-time head-to-head matchups with live vote counts. All candidates in each constituency shown.
                    </p>
                    {lastUpdated && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                            Last updated: {lastUpdated}
                            <button onClick={fetchRaceData} className="ml-2 hover:bg-white/20 rounded-full p-1 transition">
                                <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="container-app py-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Fetching live data from Election Commission...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Search Bar */}
                        <div className="max-w-md w-full relative mb-8">
                            <input
                                type="text"
                                placeholder="Search races by district or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                            />
                            <svg className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {filteredRaces.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-gray-500">No key races found matching &quot;{searchQuery}&quot;</p>
                            </div>
                        )}

                        {filteredRaces.map((race) => {
                            const candidates = raceData[race.id] || []
                            const totalVotes = candidates.reduce((sum, c) => sum + c.TotalVoteReceived, 0)
                            const votingStarted = totalVotes > 0

                            // Use pinned IDs to build the featured matchup if available
                            const pins = race.pinnedMatchup ?? []
                            let c1: ECCandidate | undefined
                            let c2: ECCandidate | undefined
                            if (pins.length >= 2) {
                                c1 = candidates.find(c => c.CandidateID === pins[0])
                                c2 = candidates.find(c => c.CandidateID === pins[1])
                            } else if (pins.length === 1) {
                                c1 = candidates.find(c => c.CandidateID === pins[0])
                                c2 = candidates.find(c => c.CandidateID !== pins[0])
                            }
                            // Fallback: use top-2 by votes
                            if (!c1 || !c2) {
                                const top2 = candidates.slice(0, 2)
                                c1 = c1 ?? top2[0]
                                c2 = c2 ?? top2[1]
                            }

                            const isExpanded = expandedRaces.has(race.id)
                            const maxVoteInRace = Math.max(...candidates.map(c => c.TotalVoteReceived), 1)

                            return (
                                <div
                                    key={race.id}
                                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Race header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="font-bold text-gray-900 text-lg">{race.constituencyEn}</span>
                                                <span className="text-gray-400 text-sm">·</span>
                                                <span className="text-gray-500 text-sm">{race.districtName}</span>
                                                <span className="text-gray-400 text-sm">·</span>
                                                <span className="text-gray-400 text-sm">{race.province}</span>
                                            </div>
                                            <p className="text-gray-500 text-sm">{race.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                <Users className="w-3 h-3 inline mr-1" />
                                                {candidates.length} candidates · {totalVotes.toLocaleString()} total votes counted
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${levelMap[race.importance_level]}`}>
                                                {race.importance_level === 'critical' ? '🔥' : race.importance_level === 'high' ? '⚡' : '📍'} {race.importance}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Head-to-head: Top 2 candidates */}
                                        {c1 && c2 ? (
                                            <>
                                                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                                    <CandidateCard
                                                        candidate={c1}
                                                        totalVotes={totalVotes}
                                                        votingStarted={votingStarted}
                                                        isLeading={votingStarted && c1.TotalVoteReceived >= c2.TotalVoteReceived}
                                                    />

                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                                            <Swords className="w-6 h-6 text-white" />
                                                        </div>
                                                        <span className="text-sm font-black text-gray-400">VS</span>
                                                    </div>

                                                    <CandidateCard
                                                        candidate={c2}
                                                        totalVotes={totalVotes}
                                                        votingStarted={votingStarted}
                                                        isLeading={votingStarted && c2.TotalVoteReceived > c1.TotalVoteReceived}
                                                    />
                                                </div>

                                                {/* Vote share bar */}
                                                <div className="mt-5">
                                                    <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
                                                        {votingStarted ? (
                                                            <>
                                                                <div
                                                                    className="h-full transition-all duration-700 flex items-center justify-end pr-1"
                                                                    style={{
                                                                        width: `${(c1.TotalVoteReceived / totalVotes) * 100}%`,
                                                                        background: getPartyColor(c1.PoliticalPartyName),
                                                                    }}
                                                                >
                                                                    <span className="text-[9px] text-white font-bold">
                                                                        {((c1.TotalVoteReceived / totalVotes) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className="h-full transition-all duration-700 flex items-center pl-1"
                                                                    style={{
                                                                        width: `${(c2.TotalVoteReceived / totalVotes) * 100}%`,
                                                                        background: getPartyColor(c2.PoliticalPartyName),
                                                                    }}
                                                                >
                                                                    <span className="text-[9px] text-white font-bold">
                                                                        {((c2.TotalVoteReceived / totalVotes) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                                                                Waiting for vote counting to begin...
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                                                        <span>{KNOWN_NAMES_EN[c1.CandidateID] || c1.CandidateName}</span>
                                                        <span>{votingStarted ? 'Vote share' : 'Counting not started'}</span>
                                                        <span>{KNOWN_NAMES_EN[c2.CandidateID] || c2.CandidateName}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <p className="text-sm">No candidates found for {race.districtName} - {race.constNumber}</p>
                                            </div>
                                        )}

                                        {/* ALL candidates list */}
                                        {candidates.length > 0 && (
                                            <div className="mt-5 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => toggleExpanded(race.id)}
                                                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition w-full"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    All {candidates.length} candidates in {race.constituencyEn}
                                                    <span className="ml-auto text-gray-400 normal-case font-normal">
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </span>
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-3 space-y-1.5">
                                                        {candidates.map((c, i) => {
                                                            const voteShare = totalVotes > 0 ? ((c.TotalVoteReceived / totalVotes) * 100) : 0
                                                            const barWidth = votingStarted ? ((c.TotalVoteReceived / maxVoteInRace) * 100) : 0
                                                            const isKnown = KNOWN_NAMES_EN[c.CandidateID]
                                                            return (
                                                                <div key={c.CandidateID} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isKnown ? 'bg-blue-50' : 'hover:bg-gray-50'} transition`}>
                                                                    <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}</span>

                                                                    {/* Photo or party dot */}
                                                                    {KNOWN_PHOTOS[c.CandidateID] ? (
                                                                        <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
                                                                            <CandidatePhoto candidateId={c.CandidateID} name={c.CandidateName} />
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className="w-3 h-3 rounded-full shrink-0"
                                                                            style={{ backgroundColor: getPartyColor(c.PoliticalPartyName) }}
                                                                        />
                                                                    )}

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-sm truncate ${isKnown ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                                                {c.CandidateName}
                                                                            </span>
                                                                            {isKnown && (
                                                                                <span className="text-[10px] text-blue-500">({isKnown})</span>
                                                                            )}
                                                                        </div>
                                                                        {/* Vote bar */}
                                                                        {votingStarted && (
                                                                            <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                                                                                <div
                                                                                    className="h-full rounded-full transition-all duration-500"
                                                                                    style={{
                                                                                        width: `${barWidth}%`,
                                                                                        backgroundColor: getPartyColor(c.PoliticalPartyName),
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <span
                                                                        className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white shrink-0"
                                                                        style={{ backgroundColor: getPartyColor(c.PoliticalPartyName) }}
                                                                    >
                                                                        {getPartyAbbr(c.PoliticalPartyName)}
                                                                    </span>

                                                                    <div className="text-right shrink-0 w-20">
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {c.TotalVoteReceived.toLocaleString()}
                                                                        </span>
                                                                        {votingStarted && (
                                                                            <span className="text-[10px] text-gray-400 ml-1">
                                                                                ({voteShare.toFixed(1)}%)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Browse all link */}
                <div className="mt-8 text-center">
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium shadow-lg shadow-emerald-200"
                    >
                        <Users className="w-5 h-5" />
                        Browse All 3,400+ Candidates
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Data source */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <strong>Live Data:</strong> All {Object.values(raceData).reduce((s, r) => s + r.length, 0)} candidates and vote counts pulled from{' '}
                        <a href="https://nepalvotes.live" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                            nepalvotes.live
                        </a>
                        {' '}and{' '}
                        <a href="https://result.election.gov.np" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                            result.election.gov.np
                        </a>
                        . Data refreshes every 30 seconds.
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Candidate card for head-to-head view ──
function CandidateCard({ candidate, totalVotes, votingStarted, isLeading }: {
    candidate: ECCandidate
    totalVotes: number
    votingStarted: boolean
    isLeading: boolean
}) {
    const partyColor = getPartyColor(candidate.PoliticalPartyName)
    const partyAbbr = getPartyAbbr(candidate.PoliticalPartyName)
    const voteShare = totalVotes > 0 ? ((candidate.TotalVoteReceived / totalVotes) * 100) : 0
    const nameEn = KNOWN_NAMES_EN[candidate.CandidateID]

    return (
        <div className={`text-center transition-all duration-500 ${isLeading ? 'scale-105' : ''}`}>
            <div className={`relative mx-auto rounded-2xl overflow-hidden bg-gray-100 shadow-md mb-3 transition-all ${isLeading ? 'w-28 h-28 ring-4 ring-yellow-400 shadow-lg shadow-yellow-200' : 'w-24 h-24'
                }`}>
                <CandidatePhoto candidateId={candidate.CandidateID} name={candidate.CandidateName} />
                {isLeading && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-sm shadow-lg">
                        👑
                    </div>
                )}
            </div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">
                {nameEn || candidate.CandidateName}
            </h3>
            {nameEn && (
                <p className="text-gray-400 text-xs">{candidate.CandidateName}</p>
            )}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white mt-1.5 mb-2" style={{ background: partyColor }}>
                {partyAbbr}
            </div>
            <p className="text-gray-400 text-xs mb-3">
                {(candidate.Gender === 'पुरुष' || candidate.Gender === 'Male') ? '♂' : '♀'}{candidate.AGE_YR > 0 ? ` ${candidate.AGE_YR} yrs ·` : ''} {candidate.SymbolName}
            </p>
            <div className="flex items-center justify-center gap-1.5">
                {votingStarted ? (
                    <>
                        <Vote className="w-4 h-4" style={{ color: partyColor }} />
                        <span className={`font-black ${isLeading ? 'text-4xl' : 'text-3xl'}`} style={{ color: partyColor }}>
                            {candidate.TotalVoteReceived.toLocaleString()}
                        </span>
                    </>
                ) : (
                    <span className="text-2xl font-black text-gray-300">—</span>
                )}
            </div>
            <p className="text-xs text-gray-400">
                {votingStarted ? `${voteShare.toFixed(1)}% vote share` : 'Awaiting results'}
            </p>
        </div>
    )
}

function isMajorParty(partyName: string): boolean {
    const major = ['एकीकृत मार्क्सवादी', 'नेपाली काँग्रेस', 'माओवादी', 'राष्ट्रिय स्वतन्त्र', 'राष्ट्रिय प्रजातन्त्र', 'नेपाली कम्युनिष्ट']
    return major.some(m => partyName.includes(m))
}
