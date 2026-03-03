'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    Activity,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Clock,
    MapPin,
    BarChart3,
    Users,
    Vote,
    Crown,
    Shield,
    Globe,
    ExternalLink,
    RefreshCw,
    Swords,
    Star,
    Award,
    Zap,
} from 'lucide-react'
import { ELECTION_DATE, MAJORITY_SEATS, partyLeaders, pmHistory, provinces } from '@/lib/sample-data'
import { formatNumber } from '@/lib/utils'

// ── Party color + info mapping ──
const PARTY_INFO: Record<string, { color: string; abbr: string; nameEn: string }> = {
    'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': { color: '#E63946', abbr: 'CPN-UML', nameEn: 'CPN (Unified Marxist-Leninist)' },
    'नेपाली काँग्रेस': { color: '#006EB5', abbr: 'NC', nameEn: 'Nepali Congress' },
    'नेपाली कम्युनिष्ट पार्टी': { color: '#C62828', abbr: 'NCP', nameEn: 'Nepal Communist Party' },
    'नेपाल कम्युनिस्ट पार्टी (माओवादी)': { color: '#8B1A1A', abbr: 'NCP-M', nameEn: 'NCP (Maoist)' },
    'राष्ट्रिय स्वतन्त्र पार्टी': { color: '#6C63FF', abbr: 'RSP', nameEn: 'Rastriya Swatantra Party' },
    'राष्ट्रिय प्रजातन्त्र पार्टी': { color: '#1565C0', abbr: 'RPP', nameEn: 'Rastriya Prajatantra Party' },
    'जनता समाजवादी पार्टी, नेपाल': { color: '#7B1FA2', abbr: 'JSP', nameEn: 'Janata Samajbadi Party' },
    'स्वतन्त्र': { color: '#607D8B', abbr: 'IND', nameEn: 'Independent' },
    'प्रगतिशील लोकतान्त्रिक पार्टी': { color: '#00838F', abbr: 'PDP', nameEn: 'Progressive Democratic Party' },
    'राष्ट्रिय जनमोर्चा': { color: '#E65100', abbr: 'RJM', nameEn: 'Rastriya Janamorcha' },
    'नेपाल मजदुर किसान पार्टी': { color: '#AD1457', abbr: 'NMKP', nameEn: 'Nepal Workers Peasants Party' },
    'जनमत पार्टी': { color: '#00695C', abbr: 'JMP', nameEn: 'Janamat Party' },
}

function getPartyInfo(name: string) {
    for (const [key, info] of Object.entries(PARTY_INFO)) {
        if (name === key || name.includes(key.split(' ')[0])) return info
    }
    return { color: '#6B7280', abbr: name.length > 8 ? name.substring(0, 6) + '…' : name, nameEn: name }
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
    ConstName: number
    TotalVoteReceived: number
}

interface PartyAggregate {
    nameNp: string
    nameEn: string
    abbr: string
    color: string
    totalVotes: number
    totalCandidates: number
    constituenciesLeading: number
    topCandidate?: string
    topCandidateVotes?: number
}

interface TopGainer {
    candidateId: number
    name: string
    party: string
    partyColor: string
    district: string
    constNumber: number
    votes: number
    voteShare: number
    rank: number
}

function useCountdown(target: Date) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, started: false })
    useEffect(() => {
        const tick = () => {
            const now = Date.now()
            const diff = target.getTime() - now
            if (diff <= 0) {
                setTime({ days: 0, hours: 0, minutes: 0, seconds: 0, started: true })
            } else {
                setTime({
                    days: Math.floor(diff / 86400000),
                    hours: Math.floor((diff % 86400000) / 3600000),
                    minutes: Math.floor((diff % 3600000) / 60000),
                    seconds: Math.floor((diff % 60000) / 1000),
                    started: false,
                })
            }
        }
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [target])
    return time
}

export default function HomePage() {
    const countdown = useCountdown(ELECTION_DATE)
    const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set())

    // Live EC data state
    const [totalCandidates, setTotalCandidates] = useState(0)
    const [totalVotes, setTotalVotes] = useState(0)
    const [totalDistricts, setTotalDistricts] = useState(0)
    const [totalConstituencies, setTotalConstituencies] = useState(0)
    const [partyAggs, setPartyAggs] = useState<PartyAggregate[]>([])
    const [topGainers, setTopGainers] = useState<TopGainer[]>([])
    const [provinceStats, setProvinceStats] = useState<Record<string, { votes: number; constituencies: number; leading: string }>>({})
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState('')
    const [isPolling, setIsPolling] = useState(false)

    const fetchDashboardData = useCallback(async () => {
        setIsPolling(true)
        try {
            const res = await fetch('/api/candidates/ec?limit=10000')
            const json = await res.json()

            if (json.status === 'ok' && json.candidates) {
                const all: ECCandidate[] = json.candidates
                setTotalCandidates(all.length)
                setTotalVotes(all.reduce((s, c) => s + c.TotalVoteReceived, 0))
                setTotalDistricts(new Set(all.map(c => c.DistrictName)).size)

                // Count constituencies
                const constKeys = new Set(all.map(c => `${c.DistrictName}-${c.ConstName}`))
                setTotalConstituencies(constKeys.size)

                // Party aggregates
                const partyMap = new Map<string, { votes: number; candidates: number; leadingIn: Set<string>; topName: string; topVotes: number }>()
                const constGrouped = new Map<string, ECCandidate[]>()

                for (const c of all) {
                    const key = `${c.DistrictName}-${c.ConstName}`
                    if (!constGrouped.has(key)) constGrouped.set(key, [])
                    constGrouped.get(key)!.push(c)

                    const p = partyMap.get(c.PoliticalPartyName) || { votes: 0, candidates: 0, leadingIn: new Set<string>(), topName: '', topVotes: 0 }
                    p.votes += c.TotalVoteReceived
                    p.candidates++
                    if (c.TotalVoteReceived > p.topVotes) {
                        p.topVotes = c.TotalVoteReceived
                        p.topName = c.CandidateName
                    }
                    partyMap.set(c.PoliticalPartyName, p)
                }

                // Find leading party in each constituency
                for (const [key, candidates] of constGrouped) {
                    const sorted = [...candidates].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)
                    if (sorted[0] && sorted[0].TotalVoteReceived > 0) {
                        const leading = partyMap.get(sorted[0].PoliticalPartyName)
                        if (leading) leading.leadingIn.add(key)
                    }
                }

                // Build sorted party aggregates
                const aggs: PartyAggregate[] = []
                for (const [name, data] of partyMap) {
                    const info = getPartyInfo(name)
                    aggs.push({
                        nameNp: name,
                        nameEn: info.nameEn,
                        abbr: info.abbr,
                        color: info.color,
                        totalVotes: data.votes,
                        totalCandidates: data.candidates,
                        constituenciesLeading: data.leadingIn.size,
                        topCandidate: data.topName,
                        topCandidateVotes: data.topVotes,
                    })
                }
                aggs.sort((a, b) => b.totalVotes - a.totalVotes)
                setPartyAggs(aggs)

                // Top gainers: candidates with highest vote share in their constituency
                const gainers: TopGainer[] = []
                for (const [, candidates] of constGrouped) {
                    const totalConstVotes = candidates.reduce((s, c) => s + c.TotalVoteReceived, 0)
                    if (totalConstVotes === 0) continue
                    const sorted = [...candidates].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)
                    for (let i = 0; i < Math.min(3, sorted.length); i++) {
                        const c = sorted[i]
                        const info = getPartyInfo(c.PoliticalPartyName)
                        gainers.push({
                            candidateId: c.CandidateID,
                            name: c.CandidateName,
                            party: info.abbr,
                            partyColor: info.color,
                            district: c.DistrictName,
                            constNumber: c.ConstName,
                            votes: c.TotalVoteReceived,
                            voteShare: (c.TotalVoteReceived / totalConstVotes) * 100,
                            rank: i + 1,
                        })
                    }
                }
                gainers.sort((a, b) => b.votes - a.votes)
                setTopGainers(gainers.filter(g => g.rank === 1).slice(0, 10))

                // Province stats
                const provMap: Record<string, { votes: number; constSet: Set<string>; partyVotes: Record<string, number> }> = {}
                for (const c of all) {
                    if (!provMap[c.StateName]) provMap[c.StateName] = { votes: 0, constSet: new Set(), partyVotes: {} }
                    provMap[c.StateName].votes += c.TotalVoteReceived
                    provMap[c.StateName].constSet.add(`${c.DistrictName}-${c.ConstName}`)
                    provMap[c.StateName].partyVotes[c.PoliticalPartyName] = (provMap[c.StateName].partyVotes[c.PoliticalPartyName] || 0) + c.TotalVoteReceived
                }
                const pStats: Record<string, { votes: number; constituencies: number; leading: string }> = {}
                for (const [prov, data] of Object.entries(provMap)) {
                    const leadingPartyEntry = Object.entries(data.partyVotes).sort((a, b) => b[1] - a[1])[0]
                    pStats[prov] = {
                        votes: data.votes,
                        constituencies: data.constSet.size,
                        leading: leadingPartyEntry ? getPartyInfo(leadingPartyEntry[0]).abbr : '—',
                    }
                }
                setProvinceStats(pStats)

                setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            }
        } catch (err) {
            console.error('Dashboard fetch failed:', err)
        } finally {
            setLoading(false)
            setIsPolling(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboardData()
        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [fetchDashboardData])

    const votingStarted = totalVotes > 0
    const isElectionStarted = countdown.started || votingStarted

    // KingMaker
    const toggleParty = (id: string) => {
        setSelectedParties(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }
    // Map KingMaker parties to live data
    const partiesWithSeats = partyLeaders.map(p => {
        const liveP = partyAggs.find(pa => pa.abbr === p.abbreviation)
        return { ...p, seats: liveP?.constituenciesLeading || p.seats }
    })
    const coalitionSeats = partiesWithSeats.filter(p => selectedParties.has(p.id)).reduce((s, p) => s + p.seats, 0)
    const canFormGov = coalitionSeats >= MAJORITY_SEATS

    const maxPartyVotes = Math.max(...partyAggs.map(p => p.totalVotes), 1)

    return (
        <div className="animate-fade-in">
            {/* ===== Countdown / Live Banner ===== */}
            <section className="relative overflow-hidden border-b border-surface-200 dark:border-surface-800">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent dark:from-brand-500/10" />
                <div className="relative container-app py-12 md:py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-4">
                        🇳🇵 Nepal Election 2082
                    </p>
                    <h2 className="text-3xl md:text-5xl font-black mb-2">
                        {isElectionStarted ? (
                            <span className="flex items-center justify-center gap-3">
                                <span className="live-dot" /> LIVE COUNTING IN PROGRESS
                            </span>
                        ) : (
                            'ELECTION COUNTDOWN'
                        )}
                    </h2>

                    {!isElectionStarted && (
                        <>
                            <div className="flex justify-center gap-3 md:gap-4 mt-8 mb-6">
                                {[
                                    { label: 'Days', value: countdown.days },
                                    { label: 'Hours', value: countdown.hours },
                                    { label: 'Minutes', value: countdown.minutes },
                                    { label: 'Seconds', value: countdown.seconds },
                                ].map(({ label, value }) => (
                                    <div key={label} className="w-18 md:w-24">
                                        <div className="card p-3 md:p-5 text-center bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700/50">
                                            <p className="text-2xl md:text-4xl font-black tabular-nums">{String(value).padStart(2, '0')}</p>
                                        </div>
                                        <p className="text-[10px] text-surface-500 uppercase tracking-widest mt-2">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-surface-500 text-sm max-w-lg mx-auto">
                                Live results will appear here once the Election Commission begins publishing data.
                                Source: <a href="https://result.election.gov.np" className="text-brand-500 hover:underline" target="_blank" rel="noopener">result.election.gov.np</a>
                            </p>
                        </>
                    )}

                    {lastUpdated && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-full px-4 py-1.5 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                            Last updated: {lastUpdated}
                            <button onClick={fetchDashboardData} className="ml-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full p-1 transition">
                                <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== Dashboard Stats (from EC data) ===== */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
                <div className="relative container-app py-16 md:py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="live-dot" />
                                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                                    {isElectionStarted ? 'Live Results: Federal Election 2082' : 'Coming Soon: Federal Election 2082'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
                                The Future of Nepal{' '}
                                <span className="gradient-text">Decided Today.</span>
                            </h1>

                            <p className="text-surface-300 text-lg leading-relaxed mb-8 max-w-lg">
                                Real-time verified data from all {totalConstituencies || 165} constituencies across {totalDistricts || 77} districts.
                                Tracking {totalCandidates.toLocaleString() || '3,400+'} candidates with live vote counts.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <Link href="/key-races" className="btn bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-3">
                                    <Swords className="w-4 h-4" /> Key Races
                                </Link>
                                <Link href="/browse" className="btn btn-secondary border-surface-600 text-white hover:bg-surface-800 px-5 py-3">
                                    Browse All Candidates
                                </Link>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-8">
                                <span className="trust-chip text-emerald-400">
                                    <Shield className="w-3.5 h-3.5" />
                                    EC Nepal Verified
                                </span>
                                <span className="trust-chip text-surface-300">
                                    <Clock className="w-3.5 h-3.5" />
                                    Auto-refreshes 30s
                                </span>
                            </div>
                        </div>

                        {/* Dashboard panel */}
                        <div className="card bg-surface-800/60 border-surface-700/50 p-5 text-white">
                            <span className="badge badge-live text-[10px] mb-4">Live Dashboard</span>
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Total Votes</p>
                                    <p className="text-2xl font-black tabular-nums">
                                        {votingStarted ? formatNumber(totalVotes) : '—'}
                                    </p>
                                    {!votingStarted && <p className="text-xs text-surface-500 mt-0.5">Awaiting results</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Candidates</p>
                                    <p className="text-2xl font-black text-brand-400 tabular-nums">{totalCandidates.toLocaleString()}</p>
                                    <p className="text-xs text-surface-500 mt-0.5">{totalDistricts} districts</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Constituencies</p>
                                    <p className="text-2xl font-black tabular-nums">{totalConstituencies}</p>
                                    <p className="text-xs text-surface-500 mt-0.5">7 provinces</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Parties</p>
                                    <p className="text-2xl font-black tabular-nums">{partyAggs.length}</p>
                                    <p className="text-xs text-surface-500 mt-0.5">{partyAggs.filter(p => p.totalVotes > 0).length} with votes</p>
                                </div>
                            </div>

                            {/* Top 3 parties */}
                            {partyAggs.slice(0, 3).map(party => (
                                <div key={party.nameNp} className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/30 mb-2">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: party.color }}>
                                        {party.abbr}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{party.nameEn}</p>
                                        <p className="text-xs text-surface-400">
                                            {party.totalCandidates} candidates
                                            {votingStarted && ` · Leading in ${party.constituenciesLeading}`}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold tabular-nums">{votingStarted ? party.totalVotes.toLocaleString() : '—'}</p>
                                        <p className="text-[10px] text-surface-400">{votingStarted ? 'votes' : 'awaiting'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Party Bar Chart ===== */}
            <section className="section border-t border-surface-200 dark:border-surface-800">
                <div className="container-app">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Party Vote Share</h2>
                            <p className="text-sm text-surface-400 mt-1">
                                {votingStarted ? 'Live party-wise vote distribution' : 'Data will appear when counting begins'}
                            </p>
                        </div>
                        <Link href="/browse" className="btn btn-secondary text-sm">
                            All Parties <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {partyAggs.slice(0, 10).map(party => (
                            <div key={party.nameNp} className="flex items-center gap-3">
                                <div className="w-16 text-right shrink-0">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: party.color }}>
                                        {party.abbr}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{party.nameEn}</span>
                                        <span className="text-sm font-bold tabular-nums">
                                            {votingStarted ? party.totalVotes.toLocaleString() : `${party.totalCandidates} candidates`}
                                        </span>
                                    </div>
                                    <div className="h-3 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: votingStarted ? `${(party.totalVotes / maxPartyVotes) * 100}%` : `${(party.totalCandidates / totalCandidates) * 100}%`,
                                                backgroundColor: party.color,
                                            }}
                                        />
                                    </div>
                                </div>
                                {votingStarted && (
                                    <div className="w-16 text-right shrink-0">
                                        <span className="text-xs text-surface-500">
                                            {((party.totalVotes / totalVotes) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Top Gainers ===== */}
            <section className="section bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
                <div className="container-app">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                                Top Gainers
                            </h2>
                            <p className="text-sm text-surface-400 mt-1">
                                {votingStarted ? 'Candidates leading in their constituency' : 'Will populate when counting begins'}
                            </p>
                        </div>
                        <Link href="/popular" className="btn btn-secondary text-sm">
                            Popular <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {votingStarted && topGainers.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {topGainers.slice(0, 10).map((gainer, i) => (
                                <div key={gainer.candidateId} className="card p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: gainer.partyColor }}>
                                            {gainer.party}
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm line-clamp-1">{gainer.name}</p>
                                    <p className="text-xs text-surface-400">{gainer.district}-{gainer.constNumber}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Vote className="w-4 h-4" style={{ color: gainer.partyColor }} />
                                        <span className="font-black text-lg" style={{ color: gainer.partyColor }}>
                                            {gainer.votes.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-surface-400">{gainer.voteShare.toFixed(1)}% vote share</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center border-dashed">
                            <TrendingUp className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                            <p className="text-surface-400 font-medium">Awaiting vote count results</p>
                            <p className="text-xs text-surface-500 mt-1">Top gainers will appear here as soon as counting begins</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== KingMaker ===== */}
            <section className="section bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
                <div className="container-app">
                    <div className="card p-6 md:p-8 bg-gradient-to-br from-surface-800/60 to-surface-900/60 border-surface-700/50 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Crown className="w-7 h-7 text-yellow-500" />
                                    <h2 className="text-2xl font-black">KINGMAKER SIMULATOR</h2>
                                </div>
                                <p className="text-surface-400 uppercase tracking-wider text-xs mb-6">
                                    Who becomes Prime Minister? Select parties to find the {MAJORITY_SEATS}-seat majority.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {partiesWithSeats.map(party => (
                                        <button
                                            key={party.id}
                                            onClick={() => toggleParty(party.id)}
                                            className={`rounded-xl p-3 text-left transition-all border ${selectedParties.has(party.id)
                                                ? 'border-brand-500 bg-brand-500/10'
                                                : 'border-surface-700 bg-surface-800/40 hover:border-surface-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{party.symbol}</span>
                                                <span className="font-bold text-xs">{party.abbreviation}</span>
                                            </div>
                                            <p className="text-sm font-black tabular-nums" style={{ color: party.color }}>{party.seats}</p>
                                            <p className="text-[10px] text-surface-500">{votingStarted ? 'leading' : 'seats'}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-56 shrink-0 text-center">
                                <div className="relative w-36 h-36 mx-auto mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-700" />
                                        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={`${(coalitionSeats / (MAJORITY_SEATS + 30)) * 327} 327`}
                                            className={canFormGov ? 'text-emerald-500' : 'text-red-500'}
                                            stroke="currentColor" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-3xl font-black tabular-nums">{coalitionSeats}</p>
                                        <p className="text-[10px] text-surface-400 uppercase">Total Seats</p>
                                    </div>
                                </div>
                                <div className={`rounded-xl p-3 ${canFormGov ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-surface-800/50 border border-surface-700/50'}`}>
                                    {canFormGov ? (
                                        <p className="font-black text-emerald-400 text-sm">🎉 GOVERNMENT POSSIBLE!</p>
                                    ) : coalitionSeats > 0 ? (
                                        <>
                                            <p className="font-black text-sm">SHORT BY <span className="text-red-500">{MAJORITY_SEATS - coalitionSeats}</span> SEATS</p>
                                            <p className="text-[10px] text-surface-500 mt-0.5">Keep adding parties</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-surface-500">Select parties above</p>
                                    )}
                                </div>
                                <div className="mt-4 text-left">
                                    <p className="text-[10px] font-bold text-surface-500 uppercase mb-2">Recent PMs</p>
                                    {pmHistory.slice(0, 3).map((pm, i) => (
                                        <div key={i} className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pm.color }} />
                                            <span className="text-xs">{pm.name} <span className="text-surface-500">({pm.term})</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Province Quick Links ===== */}
            <section className="section border-t border-surface-200 dark:border-surface-800">
                <div className="container-app">
                    <h2 className="text-xl font-bold mb-4">Browse by Province</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {provinces.map(prov => {
                            const stats = provinceStats[prov.name] || Object.values(provinceStats).find((_, i) => i === prov.number - 1)
                            return (
                                <Link key={prov.number} href={`/constituencies?province=${prov.name}`}
                                    className="card p-3 text-center group hover:border-brand-500 transition-all">
                                    <Globe className="w-5 h-5 text-surface-400 group-hover:text-brand-500 mx-auto mb-1.5 transition-colors" />
                                    <p className="font-bold text-sm">{prov.name}</p>
                                    <p className="text-xs text-surface-400">{prov.constituencies} seats</p>
                                    {stats && votingStarted && (
                                        <p className="text-[10px] mt-1 text-brand-500 font-bold">{stats.leading} leading</p>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <section className="bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 py-6">
                <div className="container-app text-center">
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-surface-500">
                        <span className="trust-chip"><Shield className="w-3 h-3 text-emerald-500" /> Data: Election Commission Nepal</span>
                        <span className="trust-chip"><Clock className="w-3 h-3 text-yellow-500" /> Auto-refreshes every 30s</span>
                        <a href="https://asbinthapa.info.np" target="_blank" rel="noopener" className="trust-chip hover:text-brand-500 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Built by Asbin Thapa
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}
