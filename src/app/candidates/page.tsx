'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, Trophy, TrendingUp, Crown, Shield, ExternalLink } from 'lucide-react'
import { sampleCandidates, partyLeaders, ELECTION_DATE, MAJORITY_SEATS } from '@/lib/sample-data'
import { useLiveData } from '@/hooks/use-data'

export default function CandidatesPage() {
    const { data: liveData } = useLiveData()
    const isStarted = liveData?.status === 'updated'

    // Merge live data into party leaders
    const partiesWithSeats = partyLeaders.map(p => {
        const live = liveData?.parties?.find((lp: any) => lp.abbreviation === p.abbreviation)
        return { ...p, seats: live?.seats || p.seats }
    })

    return (
        <div className="animate-fade-in">
            <div className="container-app py-8">
                {/* Header */}
                <Link href="/" className="flex items-center gap-1 text-surface-400 hover:text-white text-sm mb-3 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <h1 className="text-3xl md:text-4xl font-black mb-1">Candidates & Leaders</h1>
                <p className="text-surface-400 mb-8">Key political figures contesting the 2082 Federal Election</p>

                {/* Key Candidates Grid */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Key Candidates
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {sampleCandidates.map(c => (
                        <div key={c.id} className="card p-5 group hover:border-surface-400 dark:hover:border-surface-600 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg"
                                    style={{ backgroundColor: c.color }}
                                >
                                    {c.symbol}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold group-hover:text-brand-500 transition-colors">{c.name}</p>
                                    <p className="text-xs text-surface-400">{c.name_np}</p>
                                </div>
                            </div>

                            <p className="text-sm text-surface-400 mb-3">{c.role}</p>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="card p-2 bg-surface-50 dark:bg-surface-800/40">
                                    <p className="text-surface-500 uppercase text-[10px]">Constituency</p>
                                    <p className="font-semibold flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {c.constituency}
                                    </p>
                                </div>
                                <div className="card p-2 bg-surface-50 dark:bg-surface-800/40">
                                    <p className="text-surface-500 uppercase text-[10px]">Party</p>
                                    <p className="font-bold" style={{ color: c.color }}>{c.abbreviation}</p>
                                </div>
                            </div>

                            {isStarted && (
                                <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-medium">
                                            Live vote count available
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!isStarted && (
                                <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 text-center">
                                    <span className="text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full">
                                        Results Coming Soon
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Party Leaders / Seat Race */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" /> Party Leaders & Seat Projection
                </h2>
                <p className="text-surface-400 text-sm mb-6">
                    {isStarted
                        ? 'Live seat counts from Election Commission Nepal'
                        : `Results will appear here once counting begins. ${MAJORITY_SEATS} seats needed for majority.`
                    }
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                    {partiesWithSeats.map(party => (
                        <div key={party.id} className="card p-5 hover:border-surface-400 dark:hover:border-surface-600 transition-all">
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                                    style={{ backgroundColor: `${party.color}15`, border: `1px solid ${party.color}30` }}
                                >
                                    {party.symbol}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold">{party.name_en}</h3>
                                            <p className="text-xs text-surface-400">{party.name_np}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tabular-nums" style={{ color: party.color }}>
                                                {isStarted ? party.seats : '—'}
                                            </p>
                                            <p className="text-[10px] text-surface-400 uppercase">
                                                {isStarted ? 'Seats' : 'TBD'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-surface-400 mt-2">{party.ideology}</p>

                                    <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: party.color }}>
                                            {party.leader.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{party.leader}</p>
                                            <p className="text-[10px] text-surface-400">{party.leader_title} • Est. {party.founded}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-xs text-surface-500">2079 result</p>
                                            <p className="text-sm font-bold">{party.previous_seats} seats</p>
                                        </div>
                                    </div>

                                    {isStarted && (
                                        <div className="progress-bar mt-3">
                                            <div className="progress-fill" style={{ width: `${(party.seats / MAJORITY_SEATS) * 100}%`, backgroundColor: party.color }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Credit */}
                <div className="text-center mt-12 pt-6 border-t border-surface-200 dark:border-surface-800">
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-surface-500">
                        <span className="trust-chip"><Shield className="w-3 h-3 text-emerald-500" /> Data: Election Commission Nepal</span>
                        <a href="https://asbinthapa.info.np" target="_blank" rel="noopener" className="trust-chip hover:text-brand-500">
                            <ExternalLink className="w-3 h-3" /> asbinthapa.info.np
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
