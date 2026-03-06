import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Key Races — Jhapa 5, Chitwan 2, Sarlahi 4 | Balen Shah vs KP Oli Live Results',
    description: 'Live head-to-head results for Nepal Election 2082 key constituencies. Balen Shah vs KP Oli in Jhapa-5, Rabi Lamichhane in Chitwan-2, Gagan Thapa in Sarlahi-4, Prachanda in Rukum East. Real-time vote counting from EC Nepal.',
    keywords: ['Jhapa 5 election result', 'Balen Shah vs KP Oli', 'KP Oli Jhapa 5', 'Chitwan 2 result', 'Rabi Lamichhane vote count', 'Sarlahi 4 Gagan Thapa', 'Rukum East Prachanda', 'key races Nepal 2082', 'Nepal election head to head'],
    openGraph: {
        title: 'Key Races — Balen Shah vs KP Oli & More | Nepal Election 2082',
        description: 'Watch the biggest battles of Nepal Election 2082 unfold live. Jhapa-5: Balen Shah vs KP Sharma Oli. Chitwan-2: Rabi Lamichhane. Sarlahi-4: Gagan Thapa.',
    },
}

export default function KeyRacesLayout({ children }: { children: React.ReactNode }) {
    return children
}
