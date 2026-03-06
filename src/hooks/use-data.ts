'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Crash-proof fetch wrapper
async function safeFetch<T>(url: string, fallback: T): Promise<T> {
    try {
        const res = await fetch(url)
        if (!res.ok) return fallback
        const data = await res.json()
        return data as T
    } catch {
        return fallback
    }
}

// --- Elections ---
export function useElections() {
    return useQuery<any[]>({
        queryKey: ['elections'],
        queryFn: () => safeFetch('/api/elections', [] as any[]),
        staleTime: 30_000,
        retry: 2,
        retryDelay: 3000,
    })
}

export function useElection(id: string) {
    return useQuery<any>({
        queryKey: ['election', id],
        queryFn: () => safeFetch(`/api/elections/${id}`, null as any),
        staleTime: 15_000,
        refetchInterval: 30_000,
        retry: 2,
    })
}

// --- Parties ---
export function useParties() {
    return useQuery({
        queryKey: ['parties'],
        queryFn: () => safeFetch('/api/parties', []),
        staleTime: 60_000,
        retry: 2,
    })
}

// --- Constituencies ---
export function useConstituencies(params?: { province?: string; district?: string; search?: string; page?: number }) {
    const p = new URLSearchParams()
    if (params?.province) p.set('province', params.province)
    if (params?.district) p.set('district', params.district)
    if (params?.search) p.set('search', params.search)
    if (params?.page) p.set('page', String(params.page))

    return useQuery({
        queryKey: ['constituencies', params],
        queryFn: () => safeFetch(`/api/constituencies?${p}`, { constituencies: [], total: 0, page: 1, limit: 15, totalPages: 0 }),
        staleTime: 15_000,
        refetchInterval: 30_000,
        retry: 2,
    })
}

// --- Scraper / Live Data (multi-source aggregator) ---
export function useLiveData() {
    return useQuery<any>({
        queryKey: ['live-data'],
        queryFn: () => safeFetch('/api/scraper', { status: 'waiting', sources: [], nepalVotes: null, onlineKhabar: null, electionCommission: null }),
        staleTime: 15_000,
        refetchInterval: 30_000,
        retry: 1,
    })
}

// --- EC Candidates (direct live data) ---
export function useECCandidates(params?: { district?: string; province?: string; party?: string; search?: string; page?: number; limit?: number }) {
    const p = new URLSearchParams()
    if (params?.district) p.set('district', params.district)
    if (params?.province) p.set('state', params.province)
    if (params?.party) p.set('party', params.party)
    if (params?.search) p.set('search', params.search)
    if (params?.page) p.set('page', String(params.page))
    p.set('limit', String(params?.limit || 50))

    return useQuery<any>({
        queryKey: ['ec-candidates', params],
        queryFn: () => safeFetch(`/api/candidates/ec?${p}`, { status: 'unavailable', candidates: [], summary: {} }),
        staleTime: 15_000,
        refetchInterval: 30_000,
        retry: 2,
    })
}

// --- Predictions ---
export function usePredictions(electionId: string, anonId: string) {
    return useQuery({
        queryKey: ['predictions', electionId, anonId],
        queryFn: async () => {
            const params = new URLSearchParams({ election_id: electionId })
            if (anonId) params.set('anon_id', anonId)
            return safeFetch(`/api/predictions?${params}`, { counts: {}, totalVotes: 0, userVote: null })
        },
        staleTime: 10_000,
        retry: 1,
    })
}

export function useSubmitPrediction() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { election_id: string; party_id: string; anon_id: string }) => {
            const res = await fetch('/api/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed' }))
                throw new Error(err.error || 'Failed to submit prediction')
            }
            return res.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['predictions', variables.election_id] })
        },
    })
}

// --- Comments ---
export function useComments(electionId?: string) {
    return useQuery({
        queryKey: ['comments', electionId],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (electionId) params.set('election_id', electionId)
            params.set('limit', '50')
            return safeFetch(`/api/comments?${params}`, { comments: [], total: 0 })
        },
        staleTime: 5_000,
        refetchInterval: 10_000,
        retry: 1,
    })
}

export function usePostComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { election_id?: string; anon_id: string; content: string; parent_id?: string }) => {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed' }))
                throw new Error(err.error || 'Failed to post comment')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] })
        },
    })
}

export function useToggleLike() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { comment_id: string; anon_id: string }) => {
            const res = await fetch('/api/comments/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed' }))
                throw new Error(err.error || 'Failed')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] })
        },
    })
}
