'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { Menu, X, Sun, Moon, Bell, Search, BarChart3 } from 'lucide-react'

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/elections', label: 'Elections' },
    { href: '/predictions', label: 'Predictions' },
    { href: '/discussion', label: 'Live Discussion' },
    { href: '/about', label: 'About' },
]

export function Navbar() {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <nav className="nav-glass fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)]">
            <div className="container-app h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold tracking-tight">
                            <span className="text-brand-500">NEPAL</span>
                            <span>PULSE</span>
                        </span>
                    </div>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                    ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-400 w-56">
                        <Search className="w-4 h-4" />
                        <span>Search districts...</span>
                    </div>

                    {/* Notifications */}
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">N</span>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden nav-glass border-t border-surface-200 dark:border-surface-700 animate-fade-in">
                    <div className="container-app py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === link.href
                                        ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}
