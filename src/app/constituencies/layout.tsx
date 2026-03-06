import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'All 165 Constituencies — Nepal Election 2082 Results by District',
    description: 'Constituency-wise results for Nepal Federal Election 2082. See vote counts, leading candidates, and counting status for all 165 constituencies across 7 provinces and 77 districts of Nepal.',
    keywords: ['Nepal constituency results', 'constituency wise results 2082', 'Nepal district election results', 'province wise results Nepal', '165 constituencies Nepal', 'Kathmandu constituency result', 'Lalitpur result', 'constituency vote count Nepal 2082'],
    openGraph: {
        title: 'All 165 Constituencies — Nepal Election 2082 Results',
        description: 'District and constituency-wise live results for Nepal Election 2082. Track every seat across all 7 provinces.',
    },
}

export default function ConstituenciesLayout({ children }: { children: React.ReactNode }) {
    return children
}
