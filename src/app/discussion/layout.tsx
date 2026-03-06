import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Election Discussion — Nepal Election 2082 Live Chat',
    description: 'Join the live discussion about Nepal Election 2082 results. Talk about Balen Shah, KP Oli, RSP sweep, party alliances, and breaking election results with fellow Nepalis.',
    keywords: ['Nepal election discussion', 'election chat Nepal', 'Nepal election forum', 'election 2082 talk', 'Balen Shah discussion', 'Nepal politics discussion'],
    openGraph: {
        title: 'Live Election Discussion — Nepal 2082',
        description: 'Join thousands discussing Nepal Election 2082 results in real-time.',
    },
}

export default function DiscussionLayout({ children }: { children: React.ReactNode }) {
    return children
}
