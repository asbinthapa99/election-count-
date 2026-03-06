'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Crown, Shield, ExternalLink, Vote, TrendingUp, Users, RefreshCw, MapPin, Trophy } from 'lucide-react'

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
    E_STATUS: string | null
}

interface PartyStats {
    name: string
    nameEn: string
    abbreviation: string
    color: string
    totalVotes: number
    candidates: number
    leading: number
    won: number
    topCandidate: { name: string; votes: number; constituency: string } | null
}

const PARTY_COLORS: Record<string, { color: string; abbr: string; en: string }> = {
    'राष्ट्रिय स्वतन्त्र पार्टी': { color: '#6C63FF', abbr: 'RSP', en: 'Rastriya Swatantra Party' },
    'नेपाली काँग्रेस': { color: '#006EB5', abbr: 'NC', en: 'Nepali Congress' },
    'एकीकृत मार्क्सवादी लेनिनवादी': { color: '#E63946', abbr: 'CPN-UML', en: 'CPN-UML' },
    'माओवादी': { color: '#8B1A1A', abbr: 'Maoist', en: 'CPN (Maoist Centre)' },
    'नेपाली कम्युनिष्ट पार्टी': { color: '#C62828', abbr: 'NCP', en: 'Nepali Communist Party' },
    'राष्ट्रिय प्रजातन्त्र पार्टी': { color: '#1565C0', abbr: 'RPP', en: 'Rastriya Prajatantra Party' },
    'जनता समाजवादी पार्टी': { color: '#7B1FA2', abbr: 'JSP', en: 'Janata Samajwadi Party' },
    'श्रम संस्कृति पार्टी': { color: '#FF6F00', abbr: 'LSP', en: 'Shram Sanskriti Party' },
    'उज्यालो नेपाल पार्टी': { color: '#FFC107', abbr: 'UNePA', en: 'Ujyalo Nepal Party' },
    'स्वतन्त्र': { color: '#607D8B', abbr: 'IND', en: 'Independent' },
}

function getPartyInfo(name: string) {
    for (const [key, info] of Object.entries(PARTY_COLORS)) {
        if (name.includes(key)) return info
    }
    return { color: '#6B7280', abbr: name.length > 10 ? name.substring(0, 8) + '…' : name, en: name }
}

export default function CandidatesPage() {
    const [partyStats, setPartyStats] = useState<PartyStats[]>([])
    const [topCandidates, setTopCandidates] = useState<ECCandidate[]>([])
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalCandidates, setTotalCandidates] = useState(0)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState('')
    const [isPolling, setIsPolling] = useState(false)
    const [okData, setOkData] = useState<any>(null)

    const fetchData = useCallback(async () => {
        setIsPolling(true)
        try {
            // Fetch EC candidates + OnlineKhabar party data in parallel
            const [ecRes, scraperRes] = await Promise.all([
                fetch('/api/candidates/ec?limit=10000'),
                fetch('/api/scraper'),
            ])
            const ecJson = await ecRes.json()
            const scraperJson = await scraperRes.json()

            if (scraperJson.onlineKhabar) {
                setOkData(scraperJson.onlineKhabar)
            }

            if (ecJson.status === 'ok' && ecJson.candidates) {
                const all: ECCandidate[] = ecJson.candidates
                setTotalCandidates(all.length)
                setTotalVotes(ecJson.summary.totalVotes)

                // Build party stats
                const partyMap = new Map<string, { votes: number; candidates: ECCandidate[] }>()
                for (const c of all) {
                    const key = c.PoliticalPartyName
                    if (!partyMap.has(key)) partyMap.set(key, { votes: 0, candidates: [] })
                    const entry = partyMap.get(key)!
                    entry.votes += c.TotalVoteReceived
                    entry.candidates.push(c)
                }

                // Calculate leading per constituency
                const constMap = new Map<string, ECCandidate[]>()
                for (const c of all) {
                    const key = `${c.DistrictName}-${c.ConstName}`
                    if (!constMap.has(key)) constMap.set(key, [])
                    constMap.get(key)!.push(c)
                }

                const leadingByParty = new Map<string, number>()
                for (const [, candidates] of constMap) {
                    const sorted = [...candidates].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)
                    if (sorted[0] && sorted[0].TotalVoteReceived > 0) {
                        const partyKey = sorted[0].PoliticalPartyName
                        leadingByParty.set(partyKey, (leadingByParty.get(partyKey) || 0) + 1)
                    }
                }

                // Merge with OnlineKhabar seat data if available
                const okParties = scraperJson.onlineKhabar?.parties || []

                const stats: PartyStats[] = [...partyMap.entries()]
                    .filter(([, data]) => data.votes > 0)
                    .map(([name, data]) => {
                        const info = getPartyInfo(name)
                        const topCandidate = data.candidates.sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)[0]
                        // Try to find OK data by abbreviation
                        const okParty = okParties.find((p: any) =>
                            p.nickname === info.abbr || p.name?.includes(name.substring(0, 10))
                        )
                        return {
                            name,
                            nameEn: info.en,
                            abbreviation: info.abbr,
                            color: info.color,
                            totalVotes: data.votes,
                            candidates: data.candidates.length,
                            leading: okParty?.leading || leadingByParty.get(name) || 0,
                            won: okParty?.won || 0,
                            topCandidate: topCandidate && topCandidate.TotalVoteReceived > 0 ? {
                                name: topCandidate.CandidateName,
                                votes: topCandidate.TotalVoteReceived,
                                constituency: `${topCandidate.DistrictName}-${topCandidate.ConstName}`,
                            } : null,
                        }
                    })
                    .sort((a, b) => b.totalVotes - a.totalVotes)

                setPartyStats(stats)

                // Top 20 candidates by votes
                const topCands = [...all].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived).slice(0, 20)
                setTopCandidates(topCands)

                setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            }
        } catch (err) {
            console.error('Failed to fetch candidate data:', err)
        } finally {
            setLoading(false)
            setIsPolling(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [fetchData])

    const votingStarted = totalVotes > 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-slate-800 via-gray-900 to-slate-900 text-white">
                <div className="container-app py-14 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                        <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                        Live Data · Auto-refreshes every 30s
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">🏛️ Candidates & Parties</h1>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Live party standings and top candidates from the Federal Election 2082
                    </p>

                    {lastUpdated && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                            Last updated: {lastUpdated}
                            <button onClick={fetchData} className="ml-2 hover:bg-white/20 rounded-full p-1 transition">
                                <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-3xl mx-auto">
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{totalCandidates.toLocaleString()}</div>
                            <div className="text-white/60 text-xs mt-0.5">Total Candidates</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{totalVotes > 1000000 ? `${(totalVotes / 1000000).toFixed(1)}M` : totalVotes > 1000 ? `${(totalVotes / 1000).toFixed(1)}K` : totalVotes}</div>
                            <div className="text-white/60 text-xs mt-0.5">Total Votes</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{partyStats.length}</div>
                            <div className="text-white/60 text-xs mt-0.5">Parties with Votes</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{okData?.totalWinners || 0}</div>
                            <div className="text-white/60 text-xs mt-0.5">Seats Decided</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-app py-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Fetching live data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Party Standings */}
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-500" /> Party Standings
                            {okData && <span className="text-xs text-gray-400 font-normal ml-2">(Seat data from OnlineKhabar)</span>}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4 mb-12">
                            {partyStats.slice(0, 12).map((party, idx) => {
                                const voteShare = totalVotes > 0 ? ((party.totalVotes / totalVotes) * 100) : 0
                                return (
                                    <div key={party.name} className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all p-5 ${idx < 3 ? 'border-l-4' : 'border-gray-100'}`}
                                        style={idx < 3 ? { borderLeftColor: party.color } : undefined}>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: party.color }}>
                                                        {party.abbreviation}
                                                    </span>
                                                    <h3 className="font-bold text-gray-900">{party.nameEn}</h3>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">{party.candidates} candidates</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <Vote className="w-4 h-4" style={{ color: party.color }} />
                                                    <span className="text-xl font-black" style={{ color: party.color }}>
                                                        {party.totalVotes.toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">{voteShare.toFixed(1)}% share</p>
                                            </div>
                                        </div>

                                        {/* Seats bar */}
                                        {(party.leading > 0 || party.won > 0) && (
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                                                    <span className="text-sm font-bold text-orange-600">{party.leading} leading</span>
                                                </div>
                                                {party.won > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Trophy className="w-3.5 h-3.5 text-green-500" />
                                                        <span className="text-sm font-bold text-green-600">{party.won} won</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Vote bar */}
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${voteShare}%`, backgroundColor: party.color }} />
                                        </div>

                                        {party.topCandidate && (
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                Top: {party.topCandidate.name} ({party.topCandidate.constituency}) — {party.topCandidate.votes.toLocaleString()} votes
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Top Candidates */}
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Top 20 Vote Getters
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                            <div className="divide-y divide-gray-50">
                                {topCandidates.map((c, i) => {
                                    const info = getPartyInfo(c.PoliticalPartyName)
                                    return (
                                        <div key={c.CandidateID} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
                                            <span className="text-lg font-bold text-gray-300 w-8 text-right tabular-nums">{i + 1}</span>
                                            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: info.color }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{c.CandidateName}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {c.DistrictName}-{c.ConstName}
                                                    <span className="mx-1">·</span>
                                                    <span className="font-bold" style={{ color: info.color }}>{info.abbr}</span>
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-lg font-black" style={{ color: info.color }}>
                                                    {c.TotalVoteReceived.toLocaleString()}
                                                </span>
                                                <p className="text-[10px] text-gray-400">votes</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Browse all link */}
                        <div className="text-center mb-8">
                            <Link href="/browse"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition font-medium shadow-lg">
                                <Users className="w-5 h-5" />
                                Browse All {totalCandidates.toLocaleString()} Candidates
                            </Link>
                        </div>

                        {/* Credits */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                            <strong>📊 Data Sources:</strong> Vote counts from{' '}
                            <a href="https://nepalvotes.live" target="_blank" rel="noopener noreferrer" className="underline font-medium">nepalvotes.live</a>
                            {' '}· Seat data from{' '}
                            <a href="https://election.onlinekhabar.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">OnlineKhabar</a>
                            {' '}· Official source:{' '}
                            <a href="https://result.election.gov.np" target="_blank" rel="noopener noreferrer" className="underline font-medium">EC Nepal</a>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
