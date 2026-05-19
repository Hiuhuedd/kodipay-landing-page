'use client';

import { useState, useEffect } from 'react';
import { fetchAPI, getCurrentMonth, formatCurrency, formatDate } from '@/lib/api';
import { LoadingPage, EmptyState } from '@/components/ui';
import { 
    FileDown, 
    Calendar, 
    Shield, 
    CreditCard, 
    ChevronRight, 
    Check, 
    Building2, 
    DollarSign, 
    TrendingUp, 
    AlertCircle, 
    Briefcase,
    TrendingDown,
    Printer,
    Mail,
    Phone
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClientReportPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [clientDetail, setClientDetail] = useState(null);
    
    const [reportColor, setReportColor] = useState('#007aff');
    const [loading, setLoading] = useState(true);
    const [clientLoading, setClientLoading] = useState(false);
    const [error, setError] = useState(null);

    const pathname = usePathname();

    // 1. Fetch all clients on page load
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchAPI('/clients')
            .then(res => {
                setClients(res.data || []);
            })
            .catch(err => {
                console.error('Failed to fetch clients:', err);
                setError(err.message || 'Failed to retrieve client profiles from reporting server.');
            })
            .finally(() => setLoading(false));
    }, []);

    // 2. Fetch specific client details when selected
    useEffect(() => {
        if (!selectedClient) {
            setClientDetail(null);
            return;
        }

        setClientLoading(true);
        fetchAPI(`/clients/${selectedClient}`)
            .then(res => {
                setClientDetail(res.data || null);
            })
            .catch(err => {
                console.error('Failed to load client details:', err);
            })
            .finally(() => setClientLoading(false));
    }, [selectedClient]);

    const handlePrint = () => {
        window.print();
    };

    const tabs = [
        { href: '/dashboard/reports/portfolio', label: 'Portfolio Report' },
        { href: '/dashboard/reports/monthly', label: 'Monthly Property Report' },
        { href: '/dashboard/reports/tenant', label: 'Tenant Statement' },
        { href: '/dashboard/reports/client', label: 'Client Report' }
    ];

    // Consolidated calculations for the selected month
    const getMonthlyFinancials = () => {
        if (!clientDetail) return {
            payments: [],
            expenses: [],
            payouts: [],
            grossCollected: 0,
            commissionDeducted: 0,
            expensesIncurred: 0,
            payoutsDisbursed: 0,
            netOutstanding: 0
        };

        // Filter collections by selected month (format: YYYY-MM)
        const monthlyPayments = (clientDetail.payments || []).filter(pay => {
            if (!pay.createdAt) return false;
            const dateStr = typeof pay.createdAt === 'string' ? pay.createdAt : String(pay.createdAt);
            return dateStr.startsWith(month);
        });

        // Filter expenses by selected month
        const monthlyExpenses = (clientDetail.expenses || []).filter(exp => {
            if (!exp.date) return false;
            const dateStr = typeof exp.date === 'string' ? exp.date : String(exp.date);
            return dateStr.startsWith(month);
        });

        // Filter payouts by payoutMonth or createdAt starting with month
        const monthlyPayouts = (clientDetail.payouts || []).filter(p => {
            const hasPayoutMonth = p.payoutMonth === month;
            const createdAtStr = p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : String(p.createdAt)) : '';
            const hasCreatedAtMonth = createdAtStr ? createdAtStr.startsWith(month) : false;
            return hasPayoutMonth || hasCreatedAtMonth;
        });

        const grossCollected = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Dynamic commission sum based on property rate
        let commissionDeducted = 0;
        monthlyPayments.forEach(pay => {
            const prop = (clientDetail.properties || []).find(p => p.name === pay.propertyName);
            const rate = prop?.agencyCommission !== undefined ? parseFloat(prop.agencyCommission) : 8;
            commissionDeducted += pay.amount * (rate / 100);
        });

        const expensesIncurred = monthlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const payoutsDisbursed = monthlyPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const netPayoutDue = grossCollected - commissionDeducted - expensesIncurred;
        const netOutstanding = Math.max(0, netPayoutDue - payoutsDisbursed);

        return {
            payments: monthlyPayments,
            expenses: monthlyExpenses,
            payouts: monthlyPayouts,
            grossCollected,
            commissionDeducted,
            expensesIncurred,
            payoutsDisbursed,
            netOutstanding
        };
    };

    const monthlyData = getMonthlyFinancials();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 print:space-y-0 print:p-0">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Landlord Client Statement</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Consolidated financial overview across all client owned properties</p>
                </div>
            </div>

            {/* Reports Custom Sub-Tab Bar */}
            <div className="flex border-b border-[#E2E8F0] print:hidden">
                {tabs.map(t => {
                    const active = pathname === t.href;
                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-all ${
                                active
                                    ? 'border-[#007AFF] text-[#007AFF]'
                                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                            }`}
                        >
                            {t.label}
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:gap-0">
                {/* ── Configuration Sidebar (Left, 4 columns) ── */}
                <div className="lg:col-span-4 space-y-6 print:hidden">
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                            <div className="w-6 h-6 rounded bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
                                <Calendar size={14} />
                            </div>
                            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Configure Statement</h3>
                        </div>

                        {/* Client Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Landlord Client</label>
                            {loading ? (
                                <div className="h-10 bg-slate-50 animate-pulse rounded-md border border-[#E2E8F0]" />
                            ) : (
                                <select
                                    className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-all"
                                    value={selectedClient}
                                    onChange={e => setSelectedClient(e.target.value)}
                                >
                                    <option value="">-- Choose Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Month Picker */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Month</label>
                            <input
                                type="month"
                                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-all"
                                value={month}
                                onChange={e => setMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Branding options card */}
                    {selectedClient && clientDetail && (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-sm animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                                <div className="w-6 h-6 rounded bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
                                    <Shield size={14} />
                                </div>
                                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Custom Branding</h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Statement Primary Color</label>
                                <div className="grid grid-cols-4 gap-2.5">
                                    {[
                                        { label: 'Blue', color: '#007aff' },
                                        { label: 'Navy', color: '#1a237e' },
                                        { label: 'Teal', color: '#006064' },
                                        { label: 'Maroon', color: '#880e4f' },
                                        { label: 'Forest', color: '#1b5e20' },
                                        { label: 'Orange', color: '#ea580c' },
                                        { label: 'Black', color: '#000000' }
                                    ].map(c => (
                                        <button
                                            key={c.color}
                                            type="button"
                                            title={c.label}
                                            onClick={() => setReportColor(c.color)}
                                            style={{ backgroundColor: c.color }}
                                            className={`h-7 rounded-md transition-all relative flex items-center justify-center ${
                                                reportColor === c.color 
                                                    ? 'ring-2 ring-offset-2 ring-slate-800 scale-95' 
                                                    : 'hover:scale-105'
                                            }`}
                                        >
                                            {reportColor === c.color && <Check size={12} className="text-white drop-shadow" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="flex items-center justify-center gap-2 w-full h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shadow-blue-100 cursor-pointer"
                                >
                                    <Printer size={14} /> Print / Export Statement
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Client Statement Preview (Right, 8 columns) ── */}
                <div className="lg:col-span-8 print:p-0">
                    {loading || clientLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#E2E8F0] rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-[#007AFF]" />
                            <span className="text-xs text-[#64748B] font-medium mt-3 uppercase tracking-widest animate-pulse">Aggregating client ledger...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center space-y-4 max-w-[680px] mx-auto shadow-sm">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Connection Failure</h3>
                                <p className="text-xs text-[#64748B] max-w-sm mx-auto">{error}</p>
                            </div>
                        </div>
                    ) : !selectedClient || !clientDetail ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg">
                            <EmptyState
                                icon="📋"
                                title="No statement loaded"
                                desc="Choose a landlord client and reporting month from the left sidebar to generate the statement preview."
                            />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm max-w-[680px] mx-auto animate-in fade-in duration-500 print:border-none print:shadow-none">
                            {/* Live Statement Header */}
                            <div className="p-8 text-white transition-all print:bg-slate-900 print:text-black" style={{ backgroundColor: reportColor }}>
                                <div className="text-center pb-5 mb-5 border-b border-white/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">KodiPay Unified Statement</h4>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mt-1">Consolidated Landlord Statement</h3>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">{clientDetail.name}</h2>
                                        <div className="text-xs text-white/90 mt-1 font-medium space-y-0.5">
                                            {clientDetail.email && <p className="flex items-center gap-1.5"><Mail size={11} /> {clientDetail.email}</p>}
                                            {clientDetail.phone && <p className="flex items-center gap-1.5"><Phone size={11} /> {clientDetail.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 block">Statement Period</span>
                                        <span className="text-xs font-bold uppercase">
                                            {new Date(month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="p-8 space-y-6">
                                {/* Properties list owned */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Linked Assets</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(clientDetail.properties || []).map(p => (
                                            <div key={p.id} className="p-3 border border-[#E2E8F0] rounded-lg bg-slate-50/50 flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Building2 size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-xs font-bold text-slate-800 block truncate">{p.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-semibold block">{p.unitsCount || 0} Registered Units • {p.agencyCommission}% Rate</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(clientDetail.properties || []).length === 0 && (
                                            <div className="col-span-2 py-4 text-center text-xs text-slate-400 font-semibold">No assets linked to client yet</div>
                                        )}
                                    </div>
                                </div>

                                {/* Collections details list */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Monthly Collections Schedule</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2 uppercase tracking-wider">Date</th>
                                                    <th className="py-2 uppercase tracking-wider">Property</th>
                                                    <th className="py-2 uppercase tracking-wider">Tenant</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Gross Collected</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {monthlyData.payments.map((p, idx) => (
                                                    <tr key={p.id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                        <td className="py-2.5 text-[#64748B]">{formatDate(p.createdAt)}</td>
                                                        <td className="py-2.5 text-[#334155] font-semibold">{p.propertyName}</td>
                                                        <td className="py-2.5 text-slate-700 font-medium">{p.tenantName} (Unit {p.unitName})</td>
                                                        <td className="py-2.5 text-right font-bold text-emerald-600 tabular-nums">{formatCurrency(p.amount)}</td>
                                                    </tr>
                                                ))}
                                                {monthlyData.payments.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">No collections recorded this month</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Expenses details list */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Operating Expenses & Maintenance</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2 uppercase tracking-wider">Date</th>
                                                    <th className="py-2 uppercase tracking-wider">Property</th>
                                                    <th className="py-2 uppercase tracking-wider">Description</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Deducted</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {monthlyData.expenses.map((e, idx) => (
                                                    <tr key={e.id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                        <td className="py-2.5 text-[#64748B]">{formatDate(e.date)}</td>
                                                        <td className="py-2.5 text-[#334155] font-semibold">{e.propertyName}</td>
                                                        <td className="py-2.5 text-slate-700 font-medium">{e.feeName} {e.description ? `(${e.description})` : ''}</td>
                                                        <td className="py-2.5 text-right font-bold text-rose-600 tabular-nums">{formatCurrency(e.amount)}</td>
                                                    </tr>
                                                ))}
                                                {monthlyData.expenses.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">No expenses logged this month</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Dynamic metrics below tables */}
                                <div className="grid grid-cols-4 gap-3 pt-2">
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Gross Collected</span>
                                        <span className="text-sm font-bold text-slate-800 block mt-0.5 tabular-nums">{formatCurrency(monthlyData.grossCollected)}</span>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center">
                                        <span className="text-[9px] font-black text-blue-800 uppercase tracking-wider block">Commission</span>
                                        <span className="text-sm font-bold text-blue-600 block mt-0.5 tabular-nums">{formatCurrency(monthlyData.commissionDeducted)}</span>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-center">
                                        <span className="text-[9px] font-black text-rose-800 uppercase tracking-wider block">Expenses</span>
                                        <span className="text-sm font-bold text-rose-600 block mt-0.5 tabular-nums">{formatCurrency(monthlyData.expensesIncurred)}</span>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Net Outstanding</span>
                                        <span className="text-sm font-bold text-emerald-600 block mt-0.5 tabular-nums">{formatCurrency(monthlyData.netOutstanding)}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-[#E2E8F0]" />

                                {/* Disbursed payouts ledger */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Recorded Remittance / Disbursal Ledger</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2 uppercase tracking-wider">Date Disbursed</th>
                                                    <th className="py-2 uppercase tracking-wider">Method</th>
                                                    <th className="py-2 uppercase tracking-wider">Reference Code</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Paid Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {monthlyData.payouts.map((p, idx) => (
                                                    <tr key={p.id || idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                        <td className="py-2.5 text-[#64748B]">{formatDate(p.createdAt)}</td>
                                                        <td className="py-2.5 uppercase font-bold text-slate-700 text-[10px]"><span className="bg-slate-100 px-1.5 py-0.5 rounded">{p.paymentMethod}</span></td>
                                                        <td className="py-2.5 font-mono font-bold text-[#334155] uppercase">{p.referenceNumber || '—'}</td>
                                                        <td className="py-2.5 text-right font-bold text-slate-800 tabular-nums">{formatCurrency(p.amount)}</td>
                                                    </tr>
                                                ))}
                                                {monthlyData.payouts.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">No payouts recorded this month</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer info block */}
                                <div className="text-center space-y-1 text-[11px] text-[#94A3B8] pt-2">
                                    <p className="font-semibold text-[#64748B]">KodiPay Administrative Statements Service</p>
                                    <p>Preferred remittance method: <span className="font-bold text-slate-600 uppercase">{clientDetail.payoutMethod || 'mpesa'}</span> ({clientDetail.payoutDetails || 'No account details logged'})</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
