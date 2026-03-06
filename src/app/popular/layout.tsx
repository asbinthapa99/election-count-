import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Popular Candidates — Balen Shah, KP Oli, Rabi Lamichhane, Gagan Thapa Vote Count',
    description: 'Track Nepal\'s most watched candidates in Election 2082 with live vote counts. Balen Shah (Jhapa-5), KP Sharma Oli (Jhapa-5), Rabi Lamichhane (Chitwan-2), Gagan Thapa (Sarlahi-4), Prachanda (Rukum East). Real-time results.',
    keywords: ['Balen Shah vote', 'KP Oli vote count', 'Rabi Lamichhane result', 'Gagan Thapa vote', 'Prachanda result 2082', 'popular candidates Nepal', 'Nepal election 2082 trending', 'बालेन शाह', 'के.पी ओली', 'रवि लामिछाने'],
    openGraph: {
        title: 'Popular Candidates Live — Balen Shah, KP Oli, Rabi Lamichhane | Nepal 2082',
        description: 'Real-time vote tracking for Nepal\'s most watched election candidates. Live results from EC Nepal.',
    },
}

export default function PopularLayout({ children }: { children: React.ReactNode }) {
    return children
}
