'use client';

import { useState, useEffect } from 'react';
import { fetchAPI, getCurrentMonth, formatCurrency, downloadPortfolioReportPdf } from '@/lib/api';
import { PageHeader, LoadingPage, EmptyState, MonthPicker } from '@/components/ui';
import { FileDown, Building2, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

export default function PortfolioReportPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchAPI(`/reports/portfolio/month/${month}`)
            .then(d => setReport(d?.data || d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month]);

    const pdfUrl = downloadPortfolioReportPdf(month);
    const props = report?.properties || [];
    const summary = report?.summary || {};

    const kpis = [
        { label: 'Properties', value: summary.totalProperties || props.length, icon: Building2, inverted: true },
        { label: 'Expected', value: formatCurrency(summary.totalExpected), icon: DollarSign, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-100' },
        { label: 'Collected', value: formatCurrency(summary.totalCollected), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Outstanding', value: formatCurrency(summary.totalUnpaid), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Portfolio Report</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">All properties consolidated for {month}</p>
                </div>

                <div className="flex items-center gap-3">
                    <MonthPicker value={month} onChange={setMonth} />
                    {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                        >
                            <FileDown size={14} /> PDF Report
                        </a>
                    )}
                </div>
            </div>

            <div>
                {loading ? <LoadingPage /> : !report || props.length === 0 ? (
                    <div className="bg-white rounded-lg border border-[#E2E8F0] p-12">
                        <EmptyState icon="📋" title="No data" desc="No properties found for the selected month." />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpis.map(k => {
                                const Icon = k.icon;
                                const isBlack = k.inverted;
                                return (
                                    <div 
                                        key={k.label} 
                                        className={`rounded-lg border p-5 ${isBlack ? 'bg-[#0F172A] border-[#0F172A]' : 'bg-white border-[#E2E8F0]'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${isBlack ? 'bg-white/10 text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
                                                <Icon size={15} />
                                            </div>
                                            <span className={`text-[10px] font-medium uppercase tracking-widest ${isBlack ? 'text-white/60' : 'text-[#64748B]'}`}>
                                                {k.label}
                                            </span>
                                        </div>
                                        <p className={`text-xl font-semibold tracking-tight ${isBlack ? 'text-white' : 'text-[#0F172A]'}`}>
                                            {k.value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Properties Table */}
                        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                                <h3 className="text-xs font-medium text-[#0F172A] uppercase tracking-wider">Property Breakdown</h3>
                                <span className="text-xs text-[#64748B]">{props.length} properties total</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                            {['Property', 'Owner', 'Units', 'Occupied', 'Expected', 'Collected', 'Unpaid', 'Expenses', 'Net', 'Progress'].map(h => (
                                                <th key={h} className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {props.map((p, i) => {
                                            const pct = p.expected > 0 ? Math.round((p.collected / p.expected) * 100) : 0;
                                            return (
                                                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#0F172A] whitespace-nowrap">{p.name}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#64748B] whitespace-nowrap">{p.owner || '—'}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#0F172A] tabular-nums">{p.units}</td>
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#16A34A] tabular-nums">{p.occupied}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#0F172A] tabular-nums whitespace-nowrap">{formatCurrency(p.expected)}</td>
                                                    <td className="px-6 py-4 text-[13px] font-semibold text-[#16A34A] tabular-nums whitespace-nowrap">{formatCurrency(p.collected)}</td>
                                                    <td className={`px-6 py-4 text-[13px] font-medium tabular-nums whitespace-nowrap ${p.unpaid > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>{formatCurrency(p.unpaid)}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#64748B] tabular-nums whitespace-nowrap">{formatCurrency(p.expenses)}</td>
                                                    <td className={`px-6 py-4 text-[13px] font-semibold tabular-nums whitespace-nowrap ${p.net >= 0 ? 'text-[#0F172A]' : 'text-[#DC2626]'}`}>{formatCurrency(p.net)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 min-w-[100px]">
                                                            <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-[#16A34A]' : pct >= 50 ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-medium text-[#64748B] tabular-nums w-8 shrink-0">{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
