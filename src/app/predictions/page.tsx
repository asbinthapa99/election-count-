'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Vote as VoteIcon, Info, Loader2 } from 'lucide-react'
import { useParties, usePredictions, useSubmitPrediction } from '@/hooks/use-data'
import { sampleParties } from '@/lib/sample-data'
import { ensureAnonId } from '@/lib/anon-id'

const ELECTION_ID = '11111111-1111-1111-1111-111111111111'

export default function PredictionsPage() {
    const [selectedParty, setSelectedParty] = useState<string | null>(null)
    const [anonId, setAnonId] = useState('')

    const { data: liveParties } = useParties()
    const { data: predictionData, isLoading: predictionsLoading } = usePredictions(ELECTION_ID, anonId)
    const submitPrediction = useSubmitPrediction()

    const parties = liveParties && liveParties.length > 0 ? liveParties : sampleParties
    const hasVoted = !!predictionData?.userVote
    const totalVotes = predictionData?.totalVotes || 0

    useEffect(() => {
        const id = ensureAnonId()
        setAnonId(id)
    }, [])

    // Auto-select the party user already voted for
    useEffect(() => {
        if (predictionData?.userVote) {
            setSelectedParty(predictionData.userVote)
        }
    }, [predictionData?.userVote])

    const handleVote = async () => {
        if (!selectedParty || hasVoted) return
        try {
            await submitPrediction.mutateAsync({
                election_id: ELECTION_ID,
                party_id: selectedParty,
                anon_id: anonId,
            })
        } catch (err: any) {
            alert(err.message || 'Failed to submit prediction')
        }
    }

    const getPartyPercent = (partyId: string) => {
        const counts = predictionData?.counts as Record<string, any> | undefined
        if (!counts || totalVotes === 0) return '0.0'
        const count = counts[partyId]?.count || 0
        return ((count / totalVotes) * 100).toFixed(1)
    }

    const getPartyVotes = (partyId: string) => {
        const counts = predictionData?.counts as Record<string, any> | undefined
        return counts?.[partyId]?.count || 0
    }

    return (
        <div className="animate-fade-in">
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-12">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <VoteIcon className="w-6 h-6 text-brand-500" />
                            <span className="badge badge-upcoming">Public Poll</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                            Who will win the 2082 Federal Election?
                        </h1>
                        <p className="text-surface-500 dark:text-surface-400 text-lg">
                            Cast your prediction anonymously. One vote per device. See live community predictions.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-app">
                    {/* Trust Notice */}
                    <div className="card p-4 mb-8 flex items-start gap-3 bg-brand-50 dark:bg-brand-500/5 border-brand-200 dark:border-brand-500/20">
                        <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">This is a public prediction poll, not an official election.</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                Results are community predictions and do not reflect actual outcomes. No login required — identity is anonymous.
                                {totalVotes > 0 && ` • ${totalVotes} total predictions so far.`}
                            </p>
                        </div>
                    </div>

                    {/* Party Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {parties.map((party: any) => {
                            const pct = getPartyPercent(party.id)
                            const votes = getPartyVotes(party.id)

                            return (
                                <button
                                    key={party.id}
                                    onClick={() => !hasVoted && setSelectedParty(party.id)}
                                    disabled={hasVoted}
                                    className={`card p-5 text-left transition-all duration-200 relative overflow-hidden ${selectedParty === party.id
                                        ? 'ring-2 ring-brand-500 border-brand-500 dark:border-brand-500'
                                        : hasVoted
                                            ? 'opacity-80'
                                            : 'hover:border-surface-300 dark:hover:border-surface-600 cursor-pointer'
                                        }`}
                                >
                                    {selectedParty === party.id && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 className="w-5 h-5 text-brand-500" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: party.color }}
                                        >
                                            {party.abbreviation}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{party.name_en}</p>
                                            <p className="text-xs text-surface-400">{party.ideology}</p>
                                        </div>
                                    </div>
                                    {hasVoted && (
                                        <div className="animate-slide-up">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl font-bold tabular-nums" style={{ color: party.color }}>
                                                    {pct}%
                                                </span>
                                                <span className="text-xs text-surface-400">{votes} votes</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: party.color }} />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Vote Button */}
                    {!hasVoted ? (
                        <div className="text-center">
                            <button
                                onClick={handleVote}
                                disabled={!selectedParty || submitPrediction.isPending}
                                className={`btn text-base px-8 py-3 ${selectedParty ? 'btn-primary' : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                                    }`}
                            >
                                {submitPrediction.isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : selectedParty ? (
                                    'Submit Prediction'
                                ) : (
                                    'Select a party to predict'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center animate-slide-up">
                            <div className="card inline-flex items-center gap-3 px-6 py-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <div className="text-left">
                                    <p className="font-semibold">Your prediction has been recorded!</p>
                                    <p className="text-xs text-surface-400 mt-0.5">
                                        Total predictions: {totalVotes} • Stored in Supabase
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-xs text-surface-400 max-w-lg mx-auto leading-relaxed">
                            Predictions are stored securely in Supabase with anonymous IDs.{' '}
                            <a href="https://election.gov.np" target="_blank" rel="noopener" className="text-brand-500 hover:underline">
                                Election Commission Nepal
                            </a>{' '}
                            for official results.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
