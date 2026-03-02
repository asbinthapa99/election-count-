'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// --- Elections ---

export function useElections() {
    return useQuery({
        queryKey: ['elections'],
        queryFn: async () => {
            const res = await fetch('/api/elections')
            if (!res.ok) return null
            return res.json()
        },
        staleTime: 30_000, // 30s
        retry: 1,
    })
}

export function useElection(id: string) {
    return useQuery({
        queryKey: ['election', id],
        queryFn: async () => {
            const res = await fetch(`/api/elections/${id}`)
            if (!res.ok) return null
            return res.json()
        },
        staleTime: 15_000,
        refetchInterval: 30_000, // Auto-refresh every 30s for live results
        retry: 1,
    })
}

// --- Parties ---

export function useParties() {
    return useQuery({
        queryKey: ['parties'],
        queryFn: async () => {
            const res = await fetch('/api/parties')
            if (!res.ok) return null
            return res.json()
        },
        staleTime: 60_000,
        retry: 1,
    })
}

// --- Predictions ---

export function usePredictions(electionId: string, anonId: string) {
    return useQuery({
        queryKey: ['predictions', electionId, anonId],
        queryFn: async () => {
            const params = new URLSearchParams({ election_id: electionId })
            if (anonId) params.set('anon_id', anonId)
            const res = await fetch(`/api/predictions?${params}`)
            if (!res.ok) return null
            return res.json()
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
                const err = await res.json()
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
            const res = await fetch(`/api/comments?${params}`)
            if (!res.ok) return null
            return res.json()
        },
        staleTime: 5_000,
        refetchInterval: 10_000, // Auto-refresh for live discussion
        retry: 1,
    })
}

export function usePostComment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            election_id?: string
            anon_id: string
            content: string
            parent_id?: string
        }) => {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to post comment')
            }
            return res.json()
        },
        onSuccess: (_, variables) => {
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
                const err = await res.json()
                throw new Error(err.error || 'Failed')
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] })
        },
    })
}
