import { Shield, Database, Users, Globe, Mail, ChevronRight } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="animate-fade-in">
            <section className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="container-app py-16">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
                            About Nepal Election Pulse
                        </h1>
                        <p className="text-lg text-surface-500 dark:text-surface-400 leading-relaxed">
                            Nepal&apos;s most trusted independent election data platform. We aggregate verified data from official sources to provide real-time, unbiased election coverage.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container-app">
                    {/* Mission */}
                    <div className="grid md:grid-cols-2 gap-12 mb-16">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                            <p className="text-surface-500 dark:text-surface-400 leading-relaxed mb-4">
                                We believe every citizen deserves access to accurate, timely election information. Nepal Election Pulse exists to bridge the information gap during elections by providing a modern, trustworthy platform.
                            </p>
                            <p className="text-surface-500 dark:text-surface-400 leading-relaxed">
                                No political affiliation. No bias. Just verified data presented clearly.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Shield, label: 'Verified Data', desc: 'All results cross-referenced with EC Nepal' },
                                { icon: Database, label: 'Open Source', desc: 'Transparent methodology and data pipelines' },
                                { icon: Users, label: 'Community', desc: 'Anonymous, safe civic discussion forum' },
                                { icon: Globe, label: 'Accessible', desc: 'Designed for every device and connection' },
                            ].map((item) => (
                                <div key={item.label} className="card p-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-3">
                                        <item.icon className="w-5 h-5 text-brand-500" />
                                    </div>
                                    <p className="font-semibold text-sm">{item.label}</p>
                                    <p className="text-xs text-surface-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Sources */}
                    <div className="card p-8 mb-12">
                        <h2 className="text-xl font-bold mb-6">Trusted Data Sources</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { name: 'Election Commission Nepal', url: 'https://election.gov.np', priority: 'Primary' },
                                { name: 'Government of Nepal Publications', url: '#', priority: 'Primary' },
                                { name: 'Parliamentary Listings', url: '#', priority: 'Secondary' },
                                { name: 'Verified News Outlets', url: '#', priority: 'Secondary' },
                            ].map((source) => (
                                <div key={source.name} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <div>
                                        <p className="font-medium text-sm">{source.name}</p>
                                        <span className={`text-xs ${source.priority === 'Primary' ? 'text-brand-500' : 'text-surface-400'}`}>
                                            {source.priority} Source
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-surface-400" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-center max-w-xl mx-auto">
                        <p className="text-xs text-surface-400 leading-relaxed">
                            This platform aggregates election data from verified external sources. We never invent political data. Always refer to{' '}
                            <a href="https://election.gov.np" target="_blank" rel="noopener" className="text-brand-500 hover:underline">
                                Election Commission Nepal
                            </a>{' '}
                            for official confirmation.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
