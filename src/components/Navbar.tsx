'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { Menu, X, Sun, Moon, Home, Swords, Star, MapPin, Users, MessageCircle } from 'lucide-react'

const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/key-races', label: 'Key Races', icon: Swords },
    { href: '/popular', label: 'Popular', icon: Star },
    { href: '/constituencies', label: 'Constituencies', icon: MapPin },
    { href: '/browse', label: 'Browse', icon: Users },
    { href: '/discussion', label: 'Discussion', icon: MessageCircle },
]

// Bottom tab bar links (subset for phone)
const bottomTabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/key-races', label: 'Races', icon: Swords },
    { href: '/constituencies', label: 'Seats', icon: MapPin },
    { href: '/browse', label: 'Browse', icon: Users },
    { href: '/discussion', label: 'Chat', icon: MessageCircle },
]

export function Navbar() {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            {/* ─── Top Navbar ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200/60 dark:border-surface-800/60">
                <div className="container-app h-full flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <span className="text-xl leading-none">🇳🇵</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-base font-extrabold tracking-tight">
                                <span className="text-red-600">Nepal</span>
                                <span className="text-surface-900 dark:text-white">Pulse</span>
                            </span>
                            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider ml-1 hidden xs:inline">2082</span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${isActive
                                        ? 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'
                                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5">
                        {/* Live badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-[11px] font-semibold text-red-600 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="hidden xs:inline">LIVE</span>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all active:scale-90"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        {/* Mobile hamburger — hidden on phone (bottom tabs), shown on tablet */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="hidden sm:flex md:hidden w-9 h-9 rounded-lg items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all active:scale-90"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Tablet slide-down menu */}
                {mobileOpen && (
                    <div className="hidden sm:block md:hidden backdrop-blur-xl bg-white/95 dark:bg-surface-950/95 border-t border-surface-200/60 dark:border-surface-800/60 shadow-xl">
                        <div className="container-app py-2 space-y-0.5">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === link.href
                                            ? 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'
                                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* ─── Mobile Bottom Tab Bar (phone only, < 640px) ─── */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-surface-950/90 border-t border-surface-200/60 dark:border-surface-800/60 safe-area-bottom">
                <div className="flex items-center justify-around px-1 py-1">
                    {bottomTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl min-w-[52px] transition-all active:scale-90 ${isActive
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-surface-400 dark:text-surface-500'
                                    }`}
                            >
                                <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-red-50 dark:bg-red-500/10' : ''}`}>
                                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-semibold' : ''}`}>
                                    {tab.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
