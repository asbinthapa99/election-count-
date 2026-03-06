'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Users, MapPin, Building2, ChevronLeft, ChevronRight, Vote, Filter, X, ArrowUpDown } from 'lucide-react'

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

interface APIResponse {
    status: string
    timestamp?: string
    summary: {
        totalCandidates: number
        totalVotes: number
        totalDistricts: number
        totalProvinces: number
        totalParties: number
        filteredCount: number
    }
    filters: {
        districts: string[]
        provinces: string[]
        parties: string[]
    }
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    candidates: ECCandidate[]
}

const PARTY_COLORS: Record<string, string> = {
    'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': '#E63946',
    'नेपाली काँग्रेस': '#2D6A4F',
    'नेपाल कम्युनिस्ट पार्टी (माओवादी)': '#C62828',
    'राष्ट्रिय स्वतन्त्र पार्टी': '#FF9800',
    'राष्ट्रिय प्रजातन्त्र पार्टी': '#1565C0',
    'जनता समाजवादी पार्टी, नेपाल': '#7B1FA2',
    'नेपाली कम्युनिष्ट पार्टी': '#D32F2F',
    'स्वतन्त्र': '#607D8B',
}

function getPartyColor(partyName: string): string {
    for (const [key, color] of Object.entries(PARTY_COLORS)) {
        if (partyName.includes(key) || key.includes(partyName)) return color
    }
    return '#6B7280'
}

const PARTY_ABBREVIATIONS: Record<string, string> = {
    'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': 'CPN-UML',
    'नेपाली काँग्रेस': 'NC',
    'नेपाल कम्युनिस्ट पार्टी (माओवादी)': 'Maoist',
    'राष्ट्रिय स्वतन्त्र पार्टी': 'RSP',
    'राष्ट्रिय प्रजातन्त्र पार्टी': 'RPP',
    'जनता समाजवादी पार्टी, नेपाल': 'JSP',
    'नेपाली कम्युनिष्ट पार्टी': 'NCP',
    'स्वतन्त्र': 'Independent',
}

function getPartyAbbreviation(partyName: string): string {
    for (const [key, abbr] of Object.entries(PARTY_ABBREVIATIONS)) {
        if (partyName.includes(key) || key.includes(partyName)) return abbr
    }
    return partyName.length > 20 ? partyName.substring(0, 18) + '…' : partyName
}

export default function BrowseCandidatesPage() {
    const [data, setData] = useState<APIResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDistrict, setSelectedDistrict] = useState('')
    const [selectedProvince, setSelectedProvince] = useState('')
    const [selectedParty, setSelectedParty] = useState('')
    const [page, setPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<'name' | 'votes' | 'age'>('name')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchQuery) params.set('search', searchQuery)
            if (selectedDistrict) params.set('district', selectedDistrict)
            if (selectedProvince) params.set('state', selectedProvince)
            if (selectedParty) params.set('party', selectedParty)
            params.set('page', page.toString())
            params.set('limit', '30')

            const res = await fetch(`/api/candidates/ec?${params.toString()}`)
            const json = await res.json()
            setData(json)
            setError(null)
        } catch {
            setError('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }, [searchQuery, selectedDistrict, selectedProvince, selectedParty, page])

    useEffect(() => {
        const debounce = setTimeout(() => fetchData(), 300)
        return () => clearTimeout(debounce)
    }, [fetchData])

    const sortedCandidates = data?.candidates ? [...data.candidates].sort((a, b) => {
        if (sortBy === 'votes') return (b.TotalVoteReceived || 0) - (a.TotalVoteReceived || 0)
        if (sortBy === 'age') return a.AGE_YR - b.AGE_YR
        return a.CandidateName.localeCompare(b.CandidateName, 'ne')
    }) : []

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedDistrict('')
        setSelectedProvince('')
        setSelectedParty('')
        setPage(1)
    }

    const hasActiveFilters = searchQuery || selectedDistrict || selectedProvince || selectedParty

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-gray-500 hover:text-gray-700 transition">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">सबै उम्मेदवारहरू</h1>
                                <p className="text-xs text-gray-500">
                                    Source: result.election.gov.np • प्रतिनिधि सभा निर्वाचन २०८२
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${showFilters
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                        </button>
                    </div>
                    {/* Always-visible search bar */}
                    <div className="pb-3 flex flex-col gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search candidate name, district, or party..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
                                {selectedProvince && (
                                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md mb-1 border border-blue-100">
                                        <span>Province: <b>{selectedProvince}</b></span>
                                        <button onClick={() => setSelectedProvince('')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                {selectedDistrict && (
                                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md mb-1 border border-blue-100">
                                        <span>District: <b>{selectedDistrict}</b></span>
                                        <button onClick={() => setSelectedDistrict('')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                {selectedParty && (
                                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md mb-1 border border-blue-100">
                                        <span>Party: <b>{selectedParty}</b></span>
                                        <button onClick={() => setSelectedParty('')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 underline ml-1">
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            {data?.summary && (
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-wrap gap-4 sm:gap-8 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Candidates:</span>
                                <span className="font-bold text-gray-900">
                                    {data.summary.totalCandidates.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Vote className="w-4 h-4 text-green-500" />
                                <span className="text-gray-500">Total Votes:</span>
                                <span className="font-bold text-gray-900">
                                    {data.summary.totalVotes.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="text-gray-500">Districts:</span>
                                <span className="font-bold text-gray-900">{data.summary.totalDistricts}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-purple-500" />
                                <span className="text-gray-500">Parties:</span>
                                <span className="font-bold text-gray-900">{data.summary.totalParties}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Province Filter */}
                            <select
                                value={selectedProvince}
                                onChange={e => { setSelectedProvince(e.target.value); setPage(1) }}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Provinces</option>
                                {data?.filters.provinces.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            {/* District Filter */}
                            <select
                                value={selectedDistrict}
                                onChange={e => { setSelectedDistrict(e.target.value); setPage(1) }}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Districts</option>
                                {data?.filters.districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            {/* Party Filter */}
                            <select
                                value={selectedParty}
                                onChange={e => { setSelectedParty(e.target.value); setPage(1) }}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Parties</option>
                                {data?.filters.parties.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Clear */}
                        {hasActiveFilters && (
                            <div className="mt-3 text-right">
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition"
                                >
                                    <X className="w-4 h-4" />
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Sort + Results count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        {data?.pagination ? (
                            <>
                                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–
                                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                                <span className="font-semibold text-gray-700">
                                    {data.pagination.total.toLocaleString()}
                                </span> candidates
                            </>
                        ) : 'Loading...'}
                    </p>
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'name' | 'votes' | 'age')}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="votes">Sort by Votes</option>
                            <option value="age">Sort by Age</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Fetching from Election Commission...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={fetchData} className="mt-3 text-sm text-red-700 underline">
                            Retry
                        </button>
                    </div>
                )}

                {/* Candidates Grid */}
                {!loading && !error && sortedCandidates.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCandidates.map(candidate => {
                            const partyColor = getPartyColor(candidate.PoliticalPartyName)
                            const partyAbbr = getPartyAbbreviation(candidate.PoliticalPartyName)
                            return (
                                <div
                                    key={candidate.CandidateID}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    {/* Party color strip */}
                                    <div className="h-1.5" style={{ backgroundColor: partyColor }} />

                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-base truncate">
                                                    {candidate.CandidateName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span
                                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                                        style={{ backgroundColor: partyColor }}
                                                    >
                                                        {partyAbbr}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {candidate.Gender === 'पुरुष' ? '♂' : '♀'} {candidate.AGE_YR} yrs
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-2xl font-black text-gray-900">
                                                    {candidate.TotalVoteReceived.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">votes</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                <span className="font-medium">{candidate.DistrictName}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>Constituency {candidate.ConstName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                <span>{candidate.StateName}</span>
                                            </div>
                                            {candidate.QUALIFICATION && (
                                                <div className="text-[11px] text-gray-400 mt-1 truncate">
                                                    📚 {candidate.QUALIFICATION}
                                                </div>
                                            )}
                                            <div className="text-[11px] text-gray-400 mt-1">
                                                🗳️ {candidate.SymbolName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* No results */}
                {!loading && !error && sortedCandidates.length === 0 && (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No candidates found matching your filters</p>
                        <button
                            onClick={clearFilters}
                            className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: Math.min(5, data.pagination.totalPages) },
                                (_, i) => {
                                    const p = page <= 3
                                        ? i + 1
                                        : page >= data.pagination.totalPages - 2
                                            ? data.pagination.totalPages - 4 + i
                                            : page - 2 + i
                                    if (p < 1 || p > data.pagination.totalPages) return null
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition ${p === page
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                }
                            )}
                        </div>
                        <button
                            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                            disabled={page === data.pagination.totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Source attribution */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Data sourced from <a href="https://result.election.gov.np" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">result.election.gov.np</a></p>
                    <p className="mt-1">निर्वाचन आयोग नेपाल • Election Commission Nepal • Last updated: {data?.timestamp || 'N/A'}</p>
                </div>
            </div>
        </div>
    )
}
