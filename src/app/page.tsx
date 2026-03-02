'use client'

import Link from 'next/link'
import {
    Activity,
    TrendingUp,
    ChevronRight,
    CheckCircle2,
    Clock,
    MapPin,
    BarChart3,
    Users,
    Vote,
    Eye,
} from 'lucide-react'
import { useElections, useElection } from '@/hooks/use-data'
import {
    sampleElections,
    sampleParties,
    sampleActivity,
    dashboardStats as sampleDashboardStats,
} from '@/lib/sample-data'
import { formatNumber } from '@/lib/utils'

export default function HomePage() {
    const { data: liveElections } = useElections()
    const { data: federalData } = useElection('11111111-1111-1111-1111-111111111111')

    // Use live data if available, fallback to sample
    const elections = liveElections && liveElections.length > 0 ? liveElections : sampleElections
    const parties = federalData?.results
        ? federalData.results.map((r: any) => ({
            ...r.party,
            votes: r.votes,
            seats: r.seats,
            trend: parseFloat(r.trend),
            totalSeats: federalData.stats.totalConstituencies,
        }))
        : sampleParties
    const dashboardStats = federalData?.stats
        ? {
            totalVotes: federalData.stats.totalVotes,
            voterTurnout: parseFloat(federalData.stats.voterTurnout),
            turnoutChange: 4.2,
            constituenciesDecided: federalData.stats.constituenciesDecided,
            totalConstituencies: federalData.stats.totalConstituencies,
            resultPercentage: (
                (federalData.stats.constituenciesDecided / federalData.stats.totalConstituencies) *
                100
            ).toFixed(1),
        }
        : sampleDashboardStats

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-12 lg:py-16">
                    <div className="grid lg:grid-cols-2 gap-10 items-start">
                        {/* Left - Headline */}
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <span className="live-dot" />
                                <span className="text-red-500 font-semibold text-sm uppercase tracking-wider">
                                    Live Results: 2024 General Election
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-5">
                                The Future of Nepal{' '}
                                <span className="text-brand-500">Decided Today.</span>
                            </h1>
                            <p className="text-surface-500 dark:text-surface-400 text-lg leading-relaxed max-w-xl mb-8">
                                Real-time verified data from all 165 constituencies. Our platform provides the
                                most accurate and fastest election pulse in the nation.
                            </p>
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Link href="/elections/11111111-1111-1111-1111-111111111111" className="btn btn-primary">
                                    <Eye className="w-4 h-4" />
                                    View Live Map
                                </Link>
                                <Link href="/discussion" className="btn btn-secondary">
                                    Join Discussion
                                </Link>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
                                <span className="trust-chip">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Verified by Election Commission
                                </span>
                                <span className="trust-chip">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated 42s ago
                                </span>
                            </div>
                        </div>

                        {/* Dashboard Preview */}
                        <div className="space-y-4">
                            <div className="card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="badge badge-upcoming text-[10px]">Dashboard Preview</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Total Votes</p>
                                        <p className="text-2xl font-bold tabular-nums">{formatNumber(dashboardStats.totalVotes)}</p>
                                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                                            <TrendingUp className="w-3 h-3" />
                                            +{dashboardStats.turnoutChange}% turnout
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-surface-400 uppercase tracking-wider mb-1">Counted</p>
                                        <p className="text-2xl font-bold tabular-nums text-brand-500">{dashboardStats.voterTurnout}%</p>
                                        <div className="progress-bar mt-2">
                                            <div className="progress-fill bg-brand-500" style={{ width: `${dashboardStats.voterTurnout}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {parties.slice(0, 2).map((party: any) => (
                                        <div key={party.id || party.abbreviation} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ backgroundColor: party.color }}
                                                >
                                                    {party.abbreviation}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{party.name_en}</p>
                                                    <p className="text-xs text-surface-400">{party.seats} Seats Leading</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold tabular-nums">
                                                    {((party.votes / dashboardStats.totalVotes) * 100).toFixed(1)}%
                                                </p>
                                                <div className="w-20 progress-bar mt-1">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${(party.votes / dashboardStats.totalVotes) * 100}%`,
                                                            backgroundColor: party.color,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card p-5 bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-850 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-surface-400 uppercase tracking-wider">Regional Heatmap</p>
                                    <MapPin className="w-5 h-5 text-surface-400" />
                                </div>
                                <div className="mt-4 h-24 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
                                            <MapPin className="w-8 h-8 text-brand-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Active Elections */}
            <section className="section">
                <div className="container-app">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">Active Elections</h2>
                            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
                                Current voting and counting processes nationwide
                            </p>
                        </div>
                        <Link
                            href="/elections"
                            className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {elections.slice(0, 3).map((election: any) => (
                            <Link
                                key={election.id}
                                href={`/elections/${election.id}`}
                                className="card group overflow-hidden"
                            >
                                <div className="h-40 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {election.type === 'federal' && <Users className="w-12 h-12 text-surface-400" />}
                                        {election.type === 'provincial' && <BarChart3 className="w-12 h-12 text-surface-400" />}
                                        {election.type === 'by-election' && <Vote className="w-12 h-12 text-surface-400" />}
                                    </div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <span className={`badge ${election.status === 'live' ? 'badge-live' :
                                                election.status === 'verified' ? 'badge-verified' :
                                                    'badge-upcoming'
                                            }`}>
                                            {election.status === 'live' && <span className="live-dot !w-1.5 !h-1.5" />}
                                            {election.status === 'live' ? 'Live Counting' :
                                                election.status === 'verified' ? 'Verification' :
                                                    'Upcoming'}
                                        </span>
                                    </div>
                                    {election.date && (
                                        <div className="absolute top-3 right-3">
                                            <span className="text-xs text-surface-500 bg-white/80 dark:bg-surface-900/80 px-2 py-0.5 rounded-full">
                                                {typeof election.date === 'string' && election.date.includes('-')
                                                    ? new Date(election.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : election.date}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-semibold text-base group-hover:text-brand-500 transition-colors">
                                        {election.name_en}
                                    </h3>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2">
                                        {election.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leading Parties + Activity Feed */}
            <section className="section bg-white dark:bg-surface-900 border-t border-b border-surface-200 dark:border-surface-800">
                <div className="container-app">
                    <div className="grid lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Leading Parties Snapshot</h2>
                                <span className="trust-chip">
                                    <Clock className="w-3.5 h-3.5" />
                                    Last Updated: 14:03 NST
                                </span>
                            </div>
                            <div className="space-y-4">
                                {parties.slice(0, 4).map((party: any) => (
                                    <Link
                                        key={party.id || party.abbreviation}
                                        href={`/elections/11111111-1111-1111-1111-111111111111`}
                                        className="card p-4 flex items-center gap-4 group"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                                            style={{ backgroundColor: party.color }}
                                        >
                                            {party.abbreviation}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="font-semibold group-hover:text-brand-500 transition-colors">
                                                        {party.name_en}
                                                    </p>
                                                    <p className="text-xs text-surface-400">{party.ideology}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xl font-bold tabular-nums">{party.seats}</p>
                                                    <p className="text-xs text-surface-400 uppercase">Seats</p>
                                                </div>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${(party.seats / (party.totalSeats || 165)) * 100}%`,
                                                        backgroundColor: party.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="card p-5 bg-brand-500 text-white h-full">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="live-dot !bg-white" />
                                    <h3 className="font-bold text-lg">Live Activity Feed</h3>
                                </div>
                                <div className="space-y-4">
                                    {sampleActivity.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                <Activity className="w-4 h-4 text-white/70" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{item.time}</p>
                                                <p className="text-sm text-white/90 leading-relaxed">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href="/discussion"
                                    className="mt-6 block w-full text-center py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                                >
                                    View Full Discussion
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
