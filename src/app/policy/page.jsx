'use client';

import Link from 'next/link';

export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            <nav className="border-b border-[var(--border)] bg-[var(--background-secondary)]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] bg-clip-text text-transparent">
                            KodiPay
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/pricing" className="text-sm font-medium text-[var(--text-secondary)]">Pricing</Link>
                            <Link href="/dashboard" className="text-sm font-medium text-[var(--primary)]">Login</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow py-16 px-4">
                <div className="max-w-3xl mx-auto bg-[var(--background-secondary)] p-8 md:p-12 rounded-2xl border border-[var(--border)]">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Privacy Policy & Terms</h1>

                    <div className="prose prose-blue max-w-none text-[var(--text-secondary)]">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">1. Data Privacy</h2>
                            <p>
                                At KodiPay, we prioritize the security of your financial and tenant data. All sensitive information is encrypted and stored securely. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">2. Terms of Service</h2>
                            <p>
                                By using KodiPay, you agree to our terms. Our service is provided "as is" to help manage property finances. While we strive for accuracy, users are responsible for verifying their own financial records.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">3. Payment Processing</h2>
                            <p>
                                Transaction fees may apply to payments processed through our platform. These fees are transparently displayed before any transaction is completed.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">4. Account Termination</h2>
                            <p>
                                We reserve the right to suspend accounts that violate our terms of service or engage in fraudulent activity.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
