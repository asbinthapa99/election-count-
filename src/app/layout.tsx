import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/components/QueryProvider'
import Script from 'next/script'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const SITE_URL = 'https://electioncount.asbinthapa.info.np'
const SITE_NAME = 'Nepal Election Pulse – Live Election Results 2082'

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'Nepal Election 2082 Live Results | Vote Count, Candidates & Seat Tracker',
        template: '%s | Nepal Election Pulse 2082',
    },
    description: 'Track Nepal Federal Election 2082 (2026) live results — real-time vote counting for all 165 constituencies. See Balen Shah vs KP Oli in Jhapa-5, Rabi Lamichhane in Chitwan-2, Gagan Thapa results, RSP seat count, party standings. Live data from EC Nepal & NepalVotes.live.',
    keywords: [
        // Core election terms
        'Nepal election 2082', 'Nepal election results', 'Nepal election 2082 results',
        'Nepal election live count', 'election result Nepal', 'Nepal vote count 2082',
        'Nepal federal election 2026', 'निर्वाचन परिणाम २०८२', 'नेपाल निर्वाचन',
        // Popular candidates
        'Balen Shah vote count', 'Balen Shah election result', 'बालेन शाह मत',
        'KP Oli vote count', 'KP Sharma Oli Jhapa 5 result', 'के.पी ओली',
        'Rabi Lamichhane vote count', 'Rabi Lamichhane Chitwan 2', 'रवि लामिछाने',
        'Gagan Thapa vote count', 'Gagan Thapa election result', 'गगन थापा',
        'Prachanda election result', 'Pushpa Kamal Dahal vote', 'प्रचण्ड',
        // Key races
        'Jhapa 5 election result', 'Chitwan 2 election', 'Sarlahi 4 result',
        // Parties
        'RSP Nepal seats', 'Nepali Congress seats 2082', 'CPN UML seats',
        'Rastriya Swatantra Party results', 'राष्ट्रिय स्वतन्त्र पार्टी',
        // Generic
        'Nepal election tracker', 'Nepal election seat count', 'Nepal constituency results',
        'live election Nepal', 'Nepal vote counting live', 'प्रतिनिधि सभा निर्वाचन',
        'Nepal election commission results', 'nepalvotes', 'election count Nepal',
    ],
    authors: [{ name: 'Asbin Thapa', url: 'https://asbinthapa.info.np' }],
    creator: 'Asbin Thapa',
    publisher: 'Nepal Election Pulse',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: SITE_URL,
        languages: {
            'en': SITE_URL,
            'ne': `${SITE_URL}?lang=ne`,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        alternateLocale: 'ne_NP',
        url: SITE_URL,
        siteName: SITE_NAME,
        title: 'Nepal Election 2082 Live Results — Vote Count & Seat Tracker',
        description: 'Real-time Nepal Federal Election 2082 results. Live vote counting for Balen Shah, KP Oli, Rabi Lamichhane, Gagan Thapa & all 3,400+ candidates across 165 constituencies. Track RSP, NC, UML seats live.',
        images: [{
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: 'Nepal Election 2082 Live Results Dashboard',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nepal Election 2082 Live Results — Real-time Vote Count',
        description: 'Track live vote counting for all 165 constituencies. Balen Shah vs KP Oli, RSP sweep, party seat tracker. #NepalElection2082',
        images: ['/og-image.png'],
        creator: '@asbinthapa',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Nepal Election',
    },
    category: 'news',
    classification: 'Election Results, Politics, Nepal',
    other: {
        'google-site-verification': '',
        'msvalidate.01': '',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
}

// JSON-LD Structured Data
const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: 'Nepal Election Pulse',
            description: 'Live Nepal Federal Election 2082 results tracker with real-time vote counting',
            publisher: {
                '@type': 'Person',
                name: 'Asbin Thapa',
                url: 'https://asbinthapa.info.np',
            },
            potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/browse?search={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
            inLanguage: ['en', 'ne'],
        },
        {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/#webpage`,
            url: SITE_URL,
            name: 'Nepal Election 2082 Live Results — Vote Count & Seat Tracker',
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: {
                '@type': 'Event',
                name: 'Nepal Federal Election 2082 (2026)',
                startDate: '2026-03-05',
                location: {
                    '@type': 'Country',
                    name: 'Nepal',
                },
                description: 'Federal election for Nepal House of Representatives with 165 constituencies',
            },
            description: 'Track live vote counting results for Nepal Federal Election 2082 across all 165 constituencies. Real-time data from Election Commission Nepal.',
            inLanguage: 'en',
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Key Races', item: `${SITE_URL}/key-races` },
                { '@type': 'ListItem', position: 3, name: 'Browse Candidates', item: `${SITE_URL}/browse` },
                { '@type': 'ListItem', position: 4, name: 'Constituencies', item: `${SITE_URL}/constituencies` },
                { '@type': 'ListItem', position: 5, name: 'Popular Candidates', item: `${SITE_URL}/popular` },
            ],
        },
    ],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <Script
                    id="json-ld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <link rel="alternate" hrefLang="ne" href={`${SITE_URL}?lang=ne`} />
                <link rel="alternate" hrefLang="en" href={SITE_URL} />
                <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                <ThemeProvider>
                    <QueryProvider>
                        <div className="min-h-screen flex flex-col">
                            <Navbar />
                            <main className="flex-1 pt-[var(--nav-height)]">
                                {children}
                            </main>
                            <Footer />
                        </div>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}

