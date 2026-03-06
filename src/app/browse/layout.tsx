import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Browse All 3,400+ Candidates | Nepal Election 2082 Vote Count',
    description: 'Search and filter all 3,400+ candidates in Nepal Federal Election 2082. Find vote counts by name, district, constituency, province, or party. Live data from NepalVotes.live and Election Commission Nepal.',
    keywords: ['Nepal election candidates', 'candidate list Nepal 2082', 'Nepal election search', 'all candidates Nepal', 'vote count by district', 'candidate filter Nepal election', 'constituency wise results Nepal 2082'],
    openGraph: {
        title: 'Browse 3,400+ Candidates — Nepal Election 2082',
        description: 'Search any candidate by name, district, or party. Get live vote counts for all 165 constituencies in Nepal Election 2082.',
    },
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
    return children
}
