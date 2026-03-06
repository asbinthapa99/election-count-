import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Party Standings & Top Candidates | Nepal Election 2082 Seat Count',
    description: 'Live party standings for Nepal Election 2082 — RSP, Nepali Congress, CPN-UML, Maoist Centre seat counts. Top 20 vote getters. Real-time data from OnlineKhabar and EC Nepal.',
    keywords: ['Nepal election party seats', 'RSP seats 2082', 'Nepali Congress seats', 'CPN UML seats', 'party standings Nepal', 'seat count Nepal election', 'Nepal election results by party', 'top candidates Nepal 2082'],
    openGraph: {
        title: 'Party Standings & Seat Count — Nepal Election 2082 Live',
        description: 'Which party is winning? Track live seat counts for RSP, NC, UML, Maoist and more.',
    },
}

export default function CandidatesLayout({ children }: { children: React.ReactNode }) {
    return children
}
