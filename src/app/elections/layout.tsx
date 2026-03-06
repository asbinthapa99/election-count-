import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Nepal Elections — Federal Election 2082 Live Counting',
    description: 'Nepal Federal Election 2082 is currently counting votes across 165 constituencies. Track the latest seat tallies, party performance, and live results from the Election Commission of Nepal.',
    keywords: ['Nepal election 2082', 'federal election Nepal 2026', 'Nepal election counting', 'election commission Nepal results', 'Nepal election live', 'निर्वाचन २०८२', 'संघीय निर्वाचन'],
    openGraph: {
        title: 'Nepal Federal Election 2082 — Live Counting Underway',
        description: 'The Federal Election 2082 is live. Track counting progress for all 165 constituencies.',
    },
}

export default function ElectionsLayout({ children }: { children: React.ReactNode }) {
    return children
}
