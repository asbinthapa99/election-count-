import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/components/QueryProvider'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

export const metadata: Metadata = {
    title: 'Nepal Election Pulse',
    description: 'Real-time verified election results, public predictions, and live discussions for Nepal\'s democratic process.',
    keywords: ['Nepal', 'election', 'results', 'voting', 'politics', 'democracy'],
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'NepalPulse',
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
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
