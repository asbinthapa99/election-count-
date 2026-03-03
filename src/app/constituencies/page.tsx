'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, ChevronDown, Users, RefreshCw, Globe, Flag, Filter } from 'lucide-react'

interface ECCandidate {
    CandidateID: number
    CandidateName: string
    PoliticalPartyName: string
    DistrictName: string
    StateName: string
    ConstName: number
    TotalVoteReceived: number
}

interface ConstituencyGroup {
    district: string
    constNumber: number
    province: string
    candidates: { name: string; party: string; votes: number }[]
    totalVotes: number
    status: 'Pending' | 'Counting' | 'Declared'
}

interface DistrictBlock {
    district: string
    constituencies: ConstituencyGroup[]
}

const PROVINCE_NAMES = [
    'All Provinces',
    'Koshi Province',
    'Madhesh Province',
    'Bagmati Province',
    'Gandaki Province',
    'Lumbini Province',
    'Karnali Province',
    'Sudurpashchim Province',
]

const PARTY_SHORT: Record<string, string> = {
    'नेपाल कम्युनिष्ट पार्टी': 'NCP',
    'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': 'CPN-UML',
    'नेपाली काँग्रेस': 'NC',
    'नेपाली कम्युनिष्ट पार्टी': 'NCP-M',
    'राष्ट्रिय स्वतन्त्र पार्टी': 'RSP',
    'राष्ट्रिय प्रजातन्त्र पार्टी': 'RPP',
    'जनता समाजवादी पार्टी, नेपाल': 'JSP',
    'स्वतन्त्र': 'IND',
}

export default function ConstituenciesPage() {
    const [allConstituencies, setAllConstituencies] = useState<ConstituencyGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState('')
    const [isPolling, setIsPolling] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedProvince, setSelectedProvince] = useState('All Provinces')
    const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

    const fetchData = useCallback(async () => {
        setIsPolling(true)
        try {
            const res = await fetch('/api/candidates/ec?limit=10000')
            const json = await res.json()

            if (json.status === 'ok' && json.candidates) {
                const allCandidates: ECCandidate[] = json.candidates

                // Group by district + constituency
                const grouped = new Map<string, ECCandidate[]>()
                for (const c of allCandidates) {
                    const key = `${c.DistrictName}-${c.ConstName}`
                    if (!grouped.has(key)) grouped.set(key, [])
                    grouped.get(key)!.push(c)
                }

                const constData: ConstituencyGroup[] = []
                for (const [, candidates] of grouped) {
                    const first = candidates[0]
                    const totalVotes = candidates.reduce((s, c) => s + c.TotalVoteReceived, 0)
                    const sorted = [...candidates].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)

                    constData.push({
                        district: first.DistrictName,
                        constNumber: first.ConstName,
                        province: first.StateName,
                        totalVotes,
                        status: totalVotes > 0 ? 'Counting' : 'Pending',
                        candidates: sorted.map(c => ({
                            name: c.CandidateName,
                            party: c.PoliticalPartyName,
                            votes: c.TotalVoteReceived,
                        })),
                    })
                }

                constData.sort((a, b) => {
                    if (a.district !== b.district) return a.district.localeCompare(b.district, 'en')
                    return a.constNumber - b.constNumber
                })

                setAllConstituencies(constData)
                setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
            }
        } catch (err) {
            console.error('Failed to fetch:', err)
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

    // Unique districts and provinces
    const allDistricts = [...new Set(allConstituencies.map(c => c.district))].sort()
    const allProvinces = [...new Set(allConstituencies.map(c => c.province))].sort()

    // Filter
    const filtered = allConstituencies.filter(c => {
        if (selectedProvince !== 'All Provinces' && c.province !== selectedProvince) return false
        if (selectedDistrict !== 'All Districts' && c.district !== selectedDistrict) return false
        if (search) {
            const q = search.toLowerCase()
            return (
                c.district.toLowerCase().includes(q) ||
                c.province.toLowerCase().includes(q) ||
                c.candidates.some(cand => cand.name.toLowerCase().includes(q) || cand.party.toLowerCase().includes(q))
            )
        }
        return true
    })

    // Group by district for display
    const districtBlocks: DistrictBlock[] = []
    const districtMap = new Map<string, ConstituencyGroup[]>()
    for (const c of filtered) {
        if (!districtMap.has(c.district)) districtMap.set(c.district, [])
        districtMap.get(c.district)!.push(c)
    }
    for (const [district, constituencies] of districtMap) {
        districtBlocks.push({ district, constituencies })
    }
    districtBlocks.sort((a, b) => a.district.localeCompare(b.district, 'en'))

    const toggleExpand = (key: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key); else next.add(key)
            return next
        })
    }

    // Counts
    const declared = filtered.filter(c => c.status === 'Declared').length
    const counting = filtered.filter(c => c.status === 'Counting').length
    const pending = filtered.filter(c => c.status === 'Pending').length

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)' }} className="text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-3xl">🇳🇵</span>
                        <span className="text-sm font-medium opacity-80">Nepal Election Results 2082 (2026) – Live Vote Count</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-2 flex items-center gap-3">
                        <Globe className="w-8 h-8 opacity-90" />
                        165 constituencies
                    </h1>
                    <p className="text-white/70 text-base mb-1">Explore Constituencies</p>
                    <p className="text-white/50 text-sm">Constituency list by district · Browse all 165 FPTP seats</p>

                    {lastUpdated && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm">
                            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                            Last updated: {lastUpdated}
                            <button onClick={fetchData} className="ml-1 hover:bg-white/20 rounded-full p-1 transition">
                                <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Province Tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {PROVINCE_NAMES.map(prov => (
                        <button
                            key={prov}
                            onClick={() => { setSelectedProvince(prov); setSelectedDistrict('All Districts'); setSearch('') }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedProvince === prov
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            {prov === 'All Provinces' ? 'All' : prov.replace(' Province', '')}
                        </button>
                    ))}
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                    <select
                        value={selectedDistrict}
                        onChange={e => setSelectedDistrict(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm backdrop-blur focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="All Districts">All Districts</option>
                        {(selectedProvince === 'All Provinces'
                            ? allDistricts
                            : allDistricts.filter(d => allConstituencies.some(c => c.district === d && c.province === selectedProvince))
                        ).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search constituency or candidate…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm backdrop-blur placeholder:text-white/40 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                </div>

                {/* Summary bar */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                    <span className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white font-medium">
                        All {filtered.length}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-emerald-400 bg-emerald-500/10 text-xs font-semibold">
                        Declared {declared}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-yellow-400 bg-yellow-500/10 text-xs font-semibold">
                        Counting {counting}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white/50 bg-white/5 text-xs font-semibold">
                        Pending {pending}
                    </span>
                </div>

                <p className="text-white/40 text-sm mb-6">
                    Showing {filtered.length} constituencies across {districtBlocks.length} districts
                </p>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-red-200/20 border-t-red-500 rounded-full animate-spin" />
                            <p className="text-sm text-white/50">Loading constituencies from EC Nepal…</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {districtBlocks.map(block => (
                            <div key={block.district}>
                                {/* District header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{block.district}</h2>
                                        <p className="text-xs text-white/40">
                                            {block.constituencies.length} Constituenc{block.constituencies.length === 1 ? 'y' : 'ies'}
                                        </p>
                                    </div>
                                </div>

                                {/* Constituency cards */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {block.constituencies.map(c => {
                                        const cardKey = `${c.district}-${c.constNumber}`
                                        const isExpanded = expandedCards.has(cardKey)
                                        const topCandidates = c.candidates.slice(0, 3)
                                        const remaining = c.candidates.length - 3

                                        return (
                                            <div
                                                key={cardKey}
                                                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:border-white/20 transition-all"
                                            >
                                                <div className="p-5">
                                                    {/* Card header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-base font-bold text-white">
                                                                {c.district}-{c.constNumber}
                                                            </h3>
                                                            <p className="text-xs text-white/40 mt-0.5">{c.province}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${c.status === 'Counting'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : c.status === 'Declared'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-white/10 text-white/40'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-white/50 mb-3">
                                                        Total Candidates: {c.candidates.length}
                                                        {c.totalVotes > 0 && <span className="ml-2">· {c.totalVotes.toLocaleString()} votes</span>}
                                                    </p>

                                                    {/* Top candidates */}
                                                    <div className="space-y-2 mb-2">
                                                        {topCandidates.map((cand, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 && c.totalVotes > 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                                                                <span className={`font-medium ${i === 0 && c.totalVotes > 0 ? 'text-white' : 'text-white/70'}`}>
                                                                    {cand.name}
                                                                </span>
                                                                <span className="text-white/30 text-xs ml-auto shrink-0">
                                                                    ({cand.party})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Expanded candidates */}
                                                    {isExpanded && c.candidates.slice(3).map((cand, i) => (
                                                        <div key={i + 3} className="flex items-center gap-2 text-sm mb-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/20" />
                                                            <span className="text-white/60">{cand.name}</span>
                                                            <span className="text-white/25 text-xs ml-auto shrink-0">({cand.party})</span>
                                                        </div>
                                                    ))}

                                                    {remaining > 0 && (
                                                        <button
                                                            onClick={() => toggleExpand(cardKey)}
                                                            className="text-xs text-red-400 hover:text-red-300 font-medium mt-1 flex items-center gap-1 transition"
                                                        >
                                                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            {isExpanded ? 'Show less' : `+ ${remaining} more…`}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <Link
                                                    href={`/browse?district=${encodeURIComponent(c.district)}`}
                                                    className="flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium py-3 border-t border-white/5 hover:bg-white/5 transition"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pb-8 border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🇳🇵</span>
                            <div>
                                <p className="font-semibold text-white/50">Nepal HoR Election 2026</p>
                                <p>This site is for educational purposes only. Not affiliated with the Election Commission of Nepal.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Data source: <a href="https://result.election.gov.np" target="_blank" rel="noopener" className="text-red-400 hover:underline">result.election.gov.np</a></span>
                            <span>Updates every 30 seconds</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
