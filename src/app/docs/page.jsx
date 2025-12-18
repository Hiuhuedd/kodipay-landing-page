'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Docs() {
    return (
        <div className="bg-white min-h-screen">
            <Header />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-10">
                            Documentation
                        </h1>

                        <div className="space-y-16">

                            {/* Getting Started */}
                            <section id="getting-started" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Getting Started: The Welcome Setup
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        The first step in using KodiPay is the <strong>Welcome Setup</strong>. This initial configuration is crucial as it tailors the application to your specific agency needs.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-4">
                                        <li>
                                            <strong>Agency Profile:</strong> Input your agency's name, logo, and contact details. This information will appear on all automated SMS communications and generated PDF reports.
                                        </li>
                                        <li>
                                            <strong>Business Rules:</strong> Define your standard operating procedures, such as late payment grace periods, penalty percentages, and commission rates.
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        By completing this setup, you ensure that every subsequent action—from adding properties to generating reports—aligns perfectly with your business model.
                                    </p>
                                </div>
                            </section>

                            {/* Adding Properties */}
                            <section id="adding-properties" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Adding Properties
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        KodiPay utilizes a wizard-based format to make adding properties intuitive and error-free.
                                    </p>
                                    <div className="bg-blue-50 rounded-xl p-6 my-6 border border-blue-100">
                                        <h3 className="font-semibold text-blue-800 mb-2">Property Wizard Steps</h3>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li><strong>Basic Info:</strong> Name, Location, and Caretaker details.</li>
                                            <li><strong>Structure:</strong> Define the building type (Apartment, Commercial, Mixed).</li>
                                            <li><strong>Units & Categories:</strong> Categorize units (e.g., 2 Bedroom, 3 Bedroom, Shop) and bulk-add units to save time.</li>
                                        </ol>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mt-6">Automated Calculations</h3>
                                    <p className="mt-2">
                                        For every property and unit category, the system automatically calculates:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        <li><strong>Total Expected Rent:</strong> Based on unit prices (KES) and occupancy.</li>
                                        <li><strong>Utility Charges:</strong> Fixed water/garbage fees or metered inputs (KES).</li>
                                        <li><strong>Security Deposits:</strong> Auto-calculated based on unit type rules (e.g., typically 1 or 2 months' rent).</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Tenant Management */}
                            <section id="tenant-management" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Tenant Management & Onboarding
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        KodiPay distinguishes between <strong>Existing Tenants</strong> (migrated from other systems) and <strong>New Tenants</strong>.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-4">
                                        <li>
                                            <strong>Existing Tenants:</strong> When onboarding, you can migrate their current arrears or credit balances directly into their new profile without affecting current month accounting.
                                        </li>
                                        <li>
                                            <strong>New Tenants:</strong> The system guides you through lease signing, deposit collection, and initial rent pro-ration.
                                        </li>
                                    </ul>

                                    <div className="mt-8 border-l-4 border-blue-500 pl-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Account Number Based Payments</h3>
                                        <p className="mt-2 text-sm italic">
                                            "Dear John, welcome to [Agency Name]. Your unique payment account is [Unit-Number]. Please use this for all MPESA payments to Paybill [Number]."
                                        </p>
                                        <p className="mt-2">
                                            Tenants receive an automated SMS with their unique account number (usually their unit number). This ensures 100% payment attribution accuracy. All payments are processed in <strong>KES</strong>.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Processing */}
                            <section id="payment-processing" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Automated Payment Processing
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        The core of KodiPay is its robust payment engine.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 mt-4">
                                        <li>
                                            <strong>Auto-Detection:</strong> The system listens for transactions from M-Pesa (KES) and bank integrations 24/7.
                                        </li>
                                        <li>
                                            <strong>System Updates:</strong> When a payment is received, it instantly:
                                            <ol className="list-decimal pl-5 mt-2 space-y-1">
                                                <li>Matches the account number to the tenant.</li>
                                                <li>Updates the tenant's ledger (reducing arrears).</li>
                                                <li>Sends a digital receipt SMS to the tenant.</li>
                                                <li>Updates the property's "Total Collected" dashboard.</li>
                                            </ol>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Running Costs */}
                            <section id="running-costs" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Running Costs & Expenses
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        Agents can log running costs to ensure Net Income calculations are accurate.
                                    </p>
                                    <h3 className="text-lg font-semibold text-gray-900 mt-4">Categorization</h3>
                                    <p>Expenses are organized into:</p>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        <li><strong>Repairs & Maintenance:</strong> Plumbing, Electrical, Painting.</li>
                                        <li><strong>Utilities:</strong> Common area electricity, Water.</li>
                                        <li><strong>Administrative:</strong> Caretaker salaries, Office supplies.</li>
                                        <li><strong>Capital Expenditure:</strong> Major renovations or equipment.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Reports & Records */}
                            <section id="reports" className="scroll-mt-24">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
                                    Reports & Records
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600">
                                    <p>
                                        Generate professional, comprehensive reports in <strong>KES</strong> for any property and any period (Monthly, Quarterly, Annually).
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-gray-50 p-6 rounded-lg">
                                            <h3 className="font-semibold text-gray-900">Receipt Records</h3>
                                            <p className="text-sm mt-2">
                                                A detailed list of every individual payment received, including transaction codes, dates, and payers. Ready for audit trails.
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-lg">
                                            <h3 className="font-semibold text-gray-900">Export Ready</h3>
                                            <p className="text-sm mt-2">
                                                All reports can be exported to PDF or Excel format for easy sharing with landlords or accountants.
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-6">
                                        <strong>Report Contents:</strong> Every report includes a financial summary (Expected vs. Collected), an Expense Breakdown, an Arrears List, and a Net Income statement.
                                    </p>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
