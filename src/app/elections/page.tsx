'use client'

import Link from 'next/link'
import { Search, Filter, ChevronRight, Users, BarChart3, Vote, Clock, CheckCircle2 } from 'lucide-react'
import { useElections } from '@/hooks/use-data'
import { sampleElections } from '@/lib/sample-data'

export default function ElectionsPage() {
    const { data: liveElections } = useElections()
    const elections = liveElections && liveElections.length > 0 ? liveElections : sampleElections

    return (
        <div className="animate-fade-in">
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Elections</h1>
                    <p className="text-surface-500 dark:text-surface-400 text-lg">
                        Browse all active, completed, and upcoming elections across Nepal.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input type="text" placeholder="Search by name, constituency, or type..." className="input pl-10" />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-primary text-sm">All Elections</button>
                            <button className="btn btn-secondary text-sm"><Filter className="w-4 h-4" /> Filter</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                        {['All', 'Live', 'Completed', 'Upcoming'].map((tab, i) => (
                            <button key={tab} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === 0 ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'}`}>{tab}</button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-app">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {elections.map((election: any) => (
                            <Link key={election.id} href={`/elections/${election.id}`} className="card group overflow-hidden">
                                <div className="h-44 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {election.type === 'federal' && <Users className="w-12 h-12 text-surface-400" />}
                                        {election.type === 'provincial' && <BarChart3 className="w-12 h-12 text-surface-400" />}
                                        {election.type === 'by-election' && <Vote className="w-12 h-12 text-surface-400" />}
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <span className={`badge ${election.status === 'live' ? 'badge-live' : election.status === 'verified' ? 'badge-verified' : 'badge-upcoming'}`}>
                                            {election.status === 'live' && <span className="live-dot !w-1.5 !h-1.5" />}
                                            {election.status === 'live' ? 'Live Counting' : election.status === 'verified' ? 'Verified' : 'Upcoming'}
                                        </span>
                                    </div>
                                    {election.date && (
                                        <span className="absolute top-3 right-3 text-xs bg-white/80 dark:bg-surface-900/80 px-2 py-0.5 rounded-full text-surface-500">
                                            {typeof election.date === 'string' && election.date.includes('-')
                                                ? new Date(election.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : election.date}
                                        </span>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-semibold group-hover:text-brand-500 transition-colors">{election.name_en}</h3>
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">{election.description}</p>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                        <div className="flex items-center gap-3 text-xs text-surface-400">
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{election.counted}/{election.total_constituencies}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Live</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
