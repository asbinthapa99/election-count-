import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toLocaleString()
}

export function formatVotes(num: number): string {
    return num.toLocaleString('en-NP')
}

export function timeAgo(date: string | Date): string {
    const now = new Date()
    const d = new Date(date)
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function getCitizenName(anonId: string): string {
    const hash = anonId.replace(/-/g, '').slice(0, 8)
    const num = parseInt(hash, 16) % 10000
    return `Citizen ${num.toString().padStart(4, '0')}`
}

export function getPartyColor(abbreviation: string): string {
    const colors: Record<string, string> = {
        NC: '#dc2626',
        UML: '#2563eb',
        MC: '#ea580c',
        RSP: '#7c3aed',
        RPP: '#0d9488',
        JSP: '#16a34a',
        PSP: '#ca8a04',
        DEFAULT: '#6b7280',
    }
    return colors[abbreviation] || colors.DEFAULT
}
