'use client'

import { useState, use } from 'react'
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Download,
    Clock,
    Shield,
    Users,
    BarChart3,
    Vote,
    MapPin,
    MoreHorizontal,
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { useElection } from '@/hooks/use-data'
import { sampleParties, dashboardStats as sampleStats, regionalData } from '@/lib/sample-data'
import { formatNumber, formatVotes } from '@/lib/utils'

export default function ElectionDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: liveData, isLoading } = useElection(id)
    const [sortBy, setSortBy] = useState<'seats' | 'votes'>('seats')

    // Map live or sample data
    const parties = liveData?.results
        ? liveData.results.map((r: any) => ({
            id: r.party?.id || r.party_id,
            name_en: r.party?.name_en || 'Unknown',
            name_np: r.party?.name_np,
            abbreviation: r.party?.abbreviation || '?',
            ideology: r.party?.ideology || '',
            color: r.party?.color || '#6b7280',
            votes: r.votes,
            seats: r.seats,
            trend: parseFloat(r.trend),
            totalSeats: liveData.stats.totalConstituencies,
        }))
        : sampleParties

    const stats = liveData?.stats
        ? {
            totalVotes: liveData.stats.totalVotes,
            voterTurnout: parseFloat(liveData.stats.voterTurnout),
            turnoutChange: 4.2,
            constituenciesDecided: liveData.stats.constituenciesDecided,
            totalConstituencies: liveData.stats.totalConstituencies,
            resultPercentage: ((liveData.stats.constituenciesDecided / liveData.stats.totalConstituencies) * 100).toFixed(1),
        }
        : sampleStats

    const electionName = liveData?.election?.name_en || 'Federal Parliament Election 2024'

    const sortedParties = [...parties].sort((a: any, b: any) =>
        sortBy === 'seats' ? b.seats - a.seats : b.votes - a.votes
    )

    const pieData = parties.slice(0, 4).map((p: any) => ({
        name: p.abbreviation,
        value: p.seats,
        color: p.color,
    }))

    return (
        <div className="animate-fade-in">
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-8">
                    <div className="flex items-center gap-2 text-sm text-surface-400 mb-3">
                        <span className="badge badge-live text-[10px]">
                            <span className="live-dot !w-1.5 !h-1.5" />
                            Live Updates
                        </span>
                        <span>{electionName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold">Election Results Overview</h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-surface-400">
                                <span className="trust-chip">
                                    <Clock className="w-3 h-3" />
                                    Auto-refreshing every 30s
                                </span>
                                <span className="trust-chip">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    Source: EC, Nepal
                                </span>
                            </div>
                            <button className="btn btn-primary text-sm">
                                <Download className="w-4 h-4" />
                                Export Data
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-app space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-brand-500" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{stats.turnoutChange}%
                                </span>
                            </div>
                            <p className="text-xs text-surface-400 uppercase tracking-wider">Total Votes Counted</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">{formatVotes(stats.totalVotes)}</p>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-brand-500" />
                                </div>
                            </div>
                            <p className="text-xs text-surface-400 uppercase tracking-wider">Voter Turnout</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">{stats.voterTurnout}%</p>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-warning-light dark:bg-warning/10 flex items-center justify-center">
                                    <Vote className="w-5 h-5 text-warning" />
                                </div>
                                <span className="text-xs font-semibold text-brand-500">
                                    {stats.constituenciesDecided}/{stats.totalConstituencies}
                                </span>
                            </div>
                            <p className="text-xs text-surface-400 uppercase tracking-wider">Constituencies Decided</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">{stats.resultPercentage}%</p>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-surface-400" />
                                </div>
                            </div>
                            <p className="text-xs text-surface-400 uppercase tracking-wider">Regions Reporting</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">7/7</p>
                        </div>
                    </div>

                    {/* Chart + Table */}
                    <div className="grid lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">Vote Share</h3>
                                <button className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold tabular-nums">{stats.totalConstituencies}</p>
                                        <p className="text-xs text-surface-400 uppercase">Total Seats</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {parties.slice(0, 3).map((party: any) => (
                                    <div key={party.id || party.abbreviation} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: party.color }} />
                                            <span className="text-sm">{party.name_en}</span>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">{party.seats} Seats</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-3 card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">Party Rankings</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => setSortBy('seats')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === 'seats' ? 'bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-surface-100' : 'text-surface-400'}`}>Seats</button>
                                    <button onClick={() => setSortBy('votes')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === 'votes' ? 'bg-brand-500 text-white' : 'text-surface-400'}`}>Popular Vote</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-surface-400 uppercase tracking-wider">
                                            <th className="text-left py-3 px-2">Party Name</th>
                                            <th className="text-right py-3 px-2">{sortBy === 'seats' ? 'Seats' : 'Votes'}</th>
                                            <th className="text-left py-3 px-2 hidden sm:table-cell">Progress</th>
                                            <th className="text-right py-3 px-2">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                                        {sortedParties.map((party: any) => (
                                            <tr key={party.id || party.abbreviation} className="group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                                <td className="py-3.5 px-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: party.color }}>{party.abbreviation}</div>
                                                        <p className="font-medium text-sm">{party.name_en}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-2 text-right">
                                                    <span className="font-bold tabular-nums">{sortBy === 'seats' ? party.seats : formatVotes(party.votes)}</span>
                                                </td>
                                                <td className="py-3.5 px-2 hidden sm:table-cell">
                                                    <div className="w-full max-w-[200px] progress-bar">
                                                        <div className="progress-fill" style={{ width: `${sortBy === 'seats' ? (party.seats / sortedParties[0].seats) * 100 : (party.votes / sortedParties[0].votes) * 100}%`, backgroundColor: party.color }} />
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-2 text-right">
                                                    <span className={`text-sm font-medium flex items-center justify-end gap-1 ${party.trend > 0 ? 'text-emerald-500' : party.trend < 0 ? 'text-red-500' : 'text-surface-400'}`}>
                                                        {party.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : party.trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                                        {Math.abs(party.trend)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Regional Distribution */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="card p-6">
                            <h3 className="font-bold text-lg mb-4">Regional Distribution</h3>
                            <div className="space-y-4">
                                {regionalData.map((region) => (
                                    <div key={region.region}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm">{region.region}</span>
                                            <span className="text-xs font-semibold" style={{ color: region.abbreviation === 'NC' ? '#dc2626' : region.abbreviation === 'UML' ? '#2563eb' : '#ea580c' }}>
                                                {region.abbreviation} Lead
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${region.percentage}%`, backgroundColor: region.abbreviation === 'NC' ? '#dc2626' : region.abbreviation === 'UML' ? '#2563eb' : '#ea580c' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card p-6 flex flex-col items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-3">Interactive Results Map</h3>
                                <p className="text-surface-500 dark:text-surface-400 leading-relaxed max-w-md">
                                    Drill down into individual constituencies and see real-time shifts across all 7 provinces.
                                </p>
                            </div>
                            <div className="flex items-end justify-between w-full mt-6">
                                <button className="btn btn-primary">Open Map View</button>
                                <div className="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center">
                                    <MapPin className="w-12 h-12 text-brand-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
