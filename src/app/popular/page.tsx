'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, MapPin, Users, Star, ExternalLink, ChevronRight, Trophy, Activity, RefreshCw, Vote } from 'lucide-react'

// ── Tracked popular candidates matched by CandidateID from EC data ──
// These IDs are verified from result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt
const POPULAR_CANDIDATES = [
    {
        candidateId: 340111, // के.पी शर्मा ओली
        nameEn: 'KP Sharma Oli',
        roleEn: 'Former PM · CPN-UML Chair',
        party: 'CPN-UML',
        partyColor: '#E63946',
        constituencyEn: 'Jhapa-5',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/KP_Sharma_Oli.png/440px-KP_Sharma_Oli.png',
        description: 'Nepal\'s most powerful communist leader. Known for nationalist stance, infrastructure push, and India-China diplomacy.',
        previousWins: 6,
    },
    {
        candidateId: 339653, // वालेन्द्र शाह
        nameEn: 'Balen Shah',
        roleEn: 'Mayor of Kathmandu · RSP',
        party: 'RSP',
        partyColor: '#6C63FF',
        constituencyEn: 'Jhapa-5',
        photo: '/candidates/balen-shah.jpg',
        description: 'Kathmandu Mayor and rapper turned politician. Symbol of new-generation politics with massive youth support.',
        previousWins: 1,
    },
    {
        candidateId: 340990, // रवि लामिछाने
        nameEn: 'Rabi Lamichhane',
        roleEn: 'Former Home Minister · RSP Chair',
        party: 'RSP',
        partyColor: '#6C63FF',
        constituencyEn: 'Chitwan-2',
        photo: '',
        description: 'Former TV journalist turned RSP founder. Led Nepal\'s most dramatic political rise in 2022.',
        previousWins: 1,
    },
    {
        candidateId: 341549, // गगन कुमार थापा
        nameEn: 'Gagan Kumar Thapa',
        roleEn: 'NC President · PM Candidate',
        party: 'Nepali Congress',
        partyColor: '#006EB5',
        constituencyEn: 'Sarlahi-4',
        photo: '',
        description: 'Youth leader of Nepali Congress and PM hopeful. Known for clean governance and anti-corruption stance.',
        previousWins: 3,
    },
    {
        candidateId: 340050, // पुष्प कमल दाहाल प्रचण्ड
        nameEn: 'Pushpa Kamal Dahal (Prachanda)',
        roleEn: 'NCP (Maoist) Chair · Former PM (3x)',
        party: 'CPN (Maoist Centre)',
        partyColor: '#8B1A1A',
        constituencyEn: 'Rukum East-1',
        photo: '',
        description: 'Three-time PM and Maoist revolution founder. Defending his Rukum East stronghold.',
        previousWins: 5,
    },
    {
        candidateId: 340512, // वोध नारायण श्रेष्‍ठ (RSP, Dhading-2)
        nameEn: 'Bodh Narayan Shrestha',
        roleEn: 'RSP Candidate · Dhading-2',
        party: 'RSP',
        partyColor: '#6C63FF',
        constituencyEn: 'Dhading-2',
        photo: '/candidates/astha-tamang.jpg', // User provided this photo
        description: 'RSP candidate from Dhading representing the youth movement and anti-establishment politics.',
        previousWins: 0,
    },
]

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

interface MergedCandidate {
    nameEn: string
    nameNp: string
    roleEn: string
    party: string
    partyColor: string
    constituencyEn: string
    photo: string
    description: string
    previousWins: number
    votes: number
    age: number
    gender: string
    symbol: string
    district: string
    province: string
    qualification: string | null
    totalConstituencyVotes: number
    rank: number
    totalCandidatesInConst: number
}

export default function PopularCandidatesPage() {
    const [candidates, setCandidates] = useState<MergedCandidate[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState('')
    const [isPolling, setIsPolling] = useState(false)
    const [selectedParty, setSelectedParty] = useState('All')

    const fetchData = useCallback(async () => {
        setIsPolling(true)
        try {
            const res = await fetch('/api/candidates/ec?limit=10000')
            const json = await res.json()

            if (json.status === 'ok' && json.candidates) {
                const allCandidates: ECCandidate[] = json.candidates
                const merged: MergedCandidate[] = []

                for (const tracked of POPULAR_CANDIDATES) {
                    // Match by exact CandidateID
                    const ec = allCandidates.find(c => c.CandidateID === tracked.candidateId)

                    if (ec) {
                        // Find all candidates in same constituency
                        const sameConst = allCandidates.filter(
                            c => c.DistrictName === ec.DistrictName && c.ConstName === ec.ConstName
                        )
                        const totalVotes = sameConst.reduce((s, c) => s + c.TotalVoteReceived, 0)
                        const sorted = [...sameConst].sort((a, b) => b.TotalVoteReceived - a.TotalVoteReceived)
                        const rank = sorted.findIndex(c => c.CandidateID === ec.CandidateID) + 1

                        merged.push({
                            nameEn: tracked.nameEn,
                            nameNp: ec.CandidateName,
                            roleEn: tracked.roleEn,
                            party: tracked.party,
                            partyColor: tracked.partyColor,
                            constituencyEn: tracked.constituencyEn,
                            photo: tracked.photo,
                            description: tracked.description,
                            previousWins: tracked.previousWins,
                            votes: ec.TotalVoteReceived,
                            age: ec.AGE_YR,
                            gender: ec.Gender,
                            symbol: ec.SymbolName,
                            district: ec.DistrictName,
                            province: ec.StateName,
                            qualification: ec.QUALIFICATION,
                            totalConstituencyVotes: totalVotes,
                            rank,
                            totalCandidatesInConst: sameConst.length,
                        })
                    }
                }

                setCandidates(merged)
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

    const parties = ['All', ...new Set(candidates.map(c => c.party))]
    const filtered = selectedParty === 'All' ? candidates : candidates.filter(c => c.party === selectedParty)

    const totalVotesAll = candidates.reduce((s, c) => s + c.votes, 0)
    const votingStarted = totalVotesAll > 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
                <div className="container-app py-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                        <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                        Live from nepalvotes.live & OnlineKhabar · Auto-refreshes every 30s
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">Popular Candidates</h1>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto">
                        Track Nepal&apos;s most watched candidates with live vote counts from the Election Commission.
                    </p>

                    {lastUpdated && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                            Last updated: {lastUpdated}
                            <button onClick={fetchData} className="ml-2 hover:bg-white/20 rounded-full p-1 transition">
                                <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* Stats bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-3xl mx-auto">
                        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{candidates.length}</div>
                            <div className="text-white/70 text-xs mt-0.5">Tracked Candidates</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{totalVotesAll.toLocaleString()}</div>
                            <div className="text-white/70 text-xs mt-0.5">Votes Counted</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">{votingStarted ? '🟢' : '🔴'}</div>
                            <div className="text-white/70 text-xs mt-0.5">{votingStarted ? 'Counting Active' : 'Awaiting Count'}</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
                            <div className="text-2xl font-bold">30s</div>
                            <div className="text-white/70 text-xs mt-0.5">Refresh Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-app py-10">
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {parties.map(p => (
                        <button
                            key={p}
                            onClick={() => setSelectedParty(p)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedParty === p
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Fetching live data from Election Commission...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((candidate, idx) => {
                            const voteShare = candidate.totalConstituencyVotes > 0
                                ? ((candidate.votes / candidate.totalConstituencyVotes) * 100)
                                : 0
                            const isLeading = candidate.rank === 1 && votingStarted

                            return (
                                <div
                                    key={candidate.nameEn}
                                    className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${isLeading ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'
                                        }`}
                                >
                                    {/* Top banner */}
                                    <div
                                        className={`w-full ${isLeading ? 'h-3' : 'h-2'}`}
                                        style={{ background: `linear-gradient(90deg, ${candidate.partyColor}, ${candidate.partyColor}88)` }}
                                    />

                                    <div className="p-6">
                                        {/* Header row */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`relative rounded-2xl overflow-hidden shrink-0 bg-gray-100 shadow-md ${isLeading ? 'w-24 h-24 ring-4 ring-yellow-400' : 'w-20 h-20'
                                                }`}>
                                                {candidate.photo ? (
                                                    <Image
                                                        src={candidate.photo}
                                                        alt={candidate.nameEn}
                                                        fill
                                                        className="object-cover object-top"
                                                        onError={(e) => {
                                                            const img = e.target as HTMLImageElement
                                                            img.style.display = 'none'
                                                        }}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                                                        style={{ background: `linear-gradient(135deg, ${candidate.partyColor}, ${candidate.partyColor}88)` }}>
                                                        {candidate.nameEn.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                )}
                                                {isLeading && (
                                                    <div className="absolute -top-1 -right-1 text-lg">👑</div>
                                                )}
                                                <div className="absolute bottom-1 right-1 text-xs">
                                                    <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                                            {candidate.nameEn}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm">{candidate.nameNp}</p>
                                                    </div>
                                                    {votingStarted ? (
                                                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${candidate.rank === 1 ? 'bg-green-100 text-green-700' :
                                                            candidate.rank === 2 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            #{candidate.rank} of {candidate.totalCandidatesInConst}
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">
                                                            Awaiting
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{candidate.roleEn}</p>
                                            </div>
                                        </div>

                                        {/* Vote count */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    {votingStarted ? 'Vote Count' : 'Awaiting Vote Count'}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {votingStarted ? (
                                                        <>
                                                            <Vote className="w-4 h-4" style={{ color: candidate.partyColor }} />
                                                            <span className={`font-bold ${isLeading ? 'text-2xl' : 'text-xl'}`} style={{ color: candidate.partyColor }}>
                                                                {candidate.votes.toLocaleString()}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                ({voteShare.toFixed(1)}%)
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xl font-bold text-gray-300">—</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                {votingStarted ? (
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${voteShare}%`,
                                                            background: `linear-gradient(90deg, ${candidate.partyColor}, ${candidate.partyColor}99)`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-gray-200 animate-pulse" />
                                                )}
                                            </div>
                                            {votingStarted && (
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {candidate.totalConstituencyVotes.toLocaleString()} total votes in {candidate.constituencyEn}
                                                </p>
                                            )}
                                        </div>

                                        {/* Key info */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-gray-50 rounded-xl p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Constituency</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800">{candidate.constituencyEn}</p>
                                                <p className="text-xs text-gray-500">{candidate.district}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Activity className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Party</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800">{candidate.party}</p>
                                                <p className="text-xs text-gray-500">🗳️ {candidate.symbol}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                                            {candidate.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Trophy className="w-3.5 h-3.5" />
                                                <span>{candidate.previousWins} prev. wins</span>
                                                <span className="mx-1.5">·</span>
                                                <span>{(candidate.gender === 'पुरुष' || candidate.gender === 'Male') ? '♂' : '♀'}{candidate.age > 0 ? ` Age ${candidate.age}` : ''}</span>
                                            </div>
                                            <a
                                                href="https://result.election.gov.np"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-500 flex items-center gap-0.5 hover:underline"
                                            >
                                                EC Nepal <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
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
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-lg shadow-indigo-200"
                    >
                        <Users className="w-5 h-5" />
                        Browse All 3,400+ Candidates
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Disclaimer */}
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                    <strong>ℹ️ Live Data:</strong> Vote counts from{' '}
                    <a href="https://nepalvotes.live" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                        nepalvotes.live
                    </a>
                    {' '}·{' '}
                    <a href="https://result.election.gov.np" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                        EC Nepal
                    </a>
                    . Auto-refreshes every 30 seconds.
                    {!votingStarted && (
                        <>
                            <br /><br />
                            <strong>⏳ Counting has not started yet.</strong> Votes will appear here automatically when the EC begins reporting.
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
