import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Election Predictions — Nepal 2082 Seat Forecast',
    description: 'Public predictions for Nepal Election 2082 seat allocations. Vote on how many seats RSP, Nepali Congress, CPN-UML, and other parties will win. Compare your predictions with real-time results.',
    keywords: ['Nepal election prediction', 'seat prediction Nepal 2082', 'election forecast Nepal', 'party seat prediction', 'who will win Nepal election', 'RSP prediction', 'Nepal election opinion poll'],
    openGraph: {
        title: 'Election Predictions — Nepal 2082 Seat Forecast',
        description: 'Predict seat counts for Nepal Election 2082 parties and compare with live results.',
    },
}

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
    return children
}
