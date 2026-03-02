'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, ThumbsUp, Reply, Flag, Image as ImageIcon, MessageCircle, Wifi } from 'lucide-react'
import { useComments, usePostComment, useToggleLike } from '@/hooks/use-data'
import { sampleComments } from '@/lib/sample-data'
import { ensureAnonId } from '@/lib/anon-id'
import { getCitizenName, timeAgo } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface CommentData {
    id: string
    anon_id: string
    content: string
    created_at: string
    likes_count: number
    is_official?: boolean
    author_name?: string
    parent_id?: string | null
    replies?: CommentData[]
}

export default function DiscussionPage() {
    const [newComment, setNewComment] = useState('')
    const [anonId, setAnonId] = useState('')
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
    const [onlineCount] = useState(Math.floor(Math.random() * 3000) + 2000)
    const endRef = useRef<HTMLDivElement>(null)

    const { data: liveData, refetch } = useComments()
    const postComment = usePostComment()
    const toggleLike = useToggleLike()

    // Map live data or fallback to samples
    const comments: CommentData[] = liveData?.comments && liveData.comments.length > 0
        ? liveData.comments
        : (sampleComments as any[]).map((c) => ({
            ...c,
            likes_count: c.likes || 0,
            replies: c.replies || [],
        }))

    useEffect(() => {
        const id = ensureAnonId()
        setAnonId(id)

        // Load liked comments from localStorage
        const stored = localStorage.getItem('nepal_pulse_liked')
        if (stored) {
            try { setLikedComments(new Set(JSON.parse(stored))) } catch { }
        }
    }, [])

    // Subscribe to realtime comment inserts
    useEffect(() => {
        const channel = supabase
            .channel('comments-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
            }, () => {
                refetch()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [refetch])

    const handleSend = async () => {
        if (!newComment.trim() || postComment.isPending) return
        if (newComment.length > 500) {
            alert('Comment too long. Maximum 500 characters.')
            return
        }

        try {
            await postComment.mutateAsync({
                anon_id: anonId,
                content: newComment.trim(),
                election_id: '11111111-1111-1111-1111-111111111111',
            })
            setNewComment('')
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
        } catch (err: any) {
            alert(err.message || 'Failed to post comment')
        }
    }

    const handleLike = async (commentId: string) => {
        const newLiked = new Set(likedComments)
        if (newLiked.has(commentId)) {
            newLiked.delete(commentId)
        } else {
            newLiked.add(commentId)
        }
        setLikedComments(newLiked)
        localStorage.setItem('nepal_pulse_liked', JSON.stringify([...newLiked]))

        try {
            await toggleLike.mutateAsync({ comment_id: commentId, anon_id: anonId })
        } catch { }
    }

    return (
        <div className="animate-fade-in min-h-[calc(100vh-var(--nav-height))] flex flex-col">
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold">Public Forum</h1>
                            <p className="text-surface-500 dark:text-surface-400 mt-1">
                                Join the conversation about the ongoing elections.
                            </p>
                        </div>
                        <span className="badge badge-verified">
                            <Wifi className="w-3 h-3" />
                            {(onlineCount / 1000).toFixed(1)}k Online
                        </span>
                    </div>
                </div>
            </section>

            <section className="flex-1 overflow-y-auto">
                <div className="container-app py-8 space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="animate-fade-in">
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${comment.is_official ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                                    }`}>
                                    <MessageCircle className={`w-5 h-5 ${comment.is_official ? 'text-white' : 'text-surface-400'}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`font-semibold text-sm ${comment.is_official ? 'text-brand-500' : ''}`}>
                                            {comment.author_name || getCitizenName(comment.anon_id)}
                                        </span>
                                        {comment.is_official && (
                                            <span className="badge badge-upcoming text-[9px] py-0">Official</span>
                                        )}
                                        <span className="text-xs text-surface-400">
                                            {timeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <div className="card p-4 bg-surface-50 dark:bg-surface-800 border-0">
                                        <p className="text-sm leading-relaxed">{comment.content}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <button
                                            onClick={() => handleLike(comment.id)}
                                            className={`flex items-center gap-1 text-xs transition-colors ${likedComments.has(comment.id) ? 'text-brand-500' : 'text-surface-400 hover:text-surface-600'
                                                }`}
                                        >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            {comment.likes_count}
                                        </button>
                                        <button className="flex items-center gap-1 text-xs text-surface-400 hover:text-surface-600">
                                            <Reply className="w-3.5 h-3.5" />
                                            Reply
                                        </button>
                                    </div>

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 ml-4 space-y-3">
                                            {comment.replies.map((reply: any) => (
                                                <div key={reply.id} className="flex gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${reply.is_official ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                                                        }`}>
                                                        <MessageCircle className={`w-4 h-4 ${reply.is_official ? 'text-white' : 'text-surface-400'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-semibold ${reply.is_official ? 'text-brand-500' : ''}`}>
                                                                {reply.author_name || getCitizenName(reply.anon_id)}
                                                            </span>
                                                            {reply.is_official && (
                                                                <span className="badge badge-upcoming text-[9px] py-0">Official</span>
                                                            )}
                                                            <span className="text-xs text-surface-400">{timeAgo(reply.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-surface-600 dark:text-surface-300">{reply.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
            </section>

            {/* Input Bar */}
            <div className="sticky bottom-0 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
                <div className="container-app py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Share an update or join the discussion..."
                                className="input pr-10"
                                maxLength={500}
                                disabled={postComment.isPending}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!newComment.trim() || postComment.isPending}
                            className={`btn rounded-full p-3 ${newComment.trim() && !postComment.isPending
                                    ? 'btn-primary'
                                    : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                                }`}
                        >
                            <Send className={`w-5 h-5 ${postComment.isPending ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-surface-400">
                        <span>Post as <span className="text-brand-500">{anonId ? getCitizenName(anonId) : 'Citizen'}</span> (Anonymous)</span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Realtime connected
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
