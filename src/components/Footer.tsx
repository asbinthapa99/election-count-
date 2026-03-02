import Link from 'next/link'
import { BarChart3, ArrowRight } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="container-app py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold">
                                <span className="text-brand-500">NEPAL</span>
                                <span>PULSE</span>
                            </span>
                        </Link>
                        <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                            Nepal&apos;s most trusted independent election data platform. Providing real-time updates and deep analysis for every constituency.
                        </p>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-4">Resources</h4>
                        <ul className="space-y-2.5">
                            {['Voter Guide', 'Constituency Maps', 'Historical Data', 'Candidate Profiles'].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-4">Support</h4>
                        <ul className="space-y-2.5">
                            {['Help Center', 'Report Discrepancy', 'Data API', 'Press Kit'].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-4">Newsletter</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">Get the latest election results delivered to your inbox.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="input flex-1 text-sm"
                            />
                            <button className="btn btn-primary p-2.5 rounded-xl">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-surface-400">
                        © 2024 Nepal Election Pulse. Independent Reporting. No political affiliation.
                    </p>
                    <div className="flex items-center gap-4">
                        {['Privacy Policy', 'Terms of Service', 'Verification Methodology'].map(item => (
                            <a key={item} href="#" className="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
