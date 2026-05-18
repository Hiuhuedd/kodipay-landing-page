'use client';

import { useState, useEffect } from 'react';
import { getProperties, getPropertyReport, getCurrentMonth, formatCurrency, downloadPropertyReportPdf } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, EmptyState, MonthPicker, ProgressBar } from '@/components/ui';
import { FileDown, TrendingUp, TrendingDown, DollarSign, AlertCircle, Users, BarChart3 } from 'lucide-react';

export default function MonthlyReportPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [propsLoading, setPropsLoading] = useState(true);

    useEffect(() => {
        getProperties()
            .then(d => {
                const list = d?.data || d || [];
                setProperties(list);
                if (list.length > 0 && !selectedProp) setSelectedProp(list[0].id);
            })
            .catch(console.error)
            .finally(() => setPropsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedProp) return;
        setLoading(true);
        getPropertyReport(selectedProp, month)
            .then(d => setReport(d?.data || d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedProp, month]);

    if (propsLoading) return <LoadingPage />;

    const fin = report?.financials || {};
    const tenants = report?.tenants || [];
    const pdfUrl = selectedProp ? downloadPropertyReportPdf(selectedProp, month) : null;
    const collectionPct = fin.income?.expected > 0
        ? Math.round((fin.income.total / fin.income.expected) * 100)
        : 0;

    const kpis = [
        { label: 'Collected', value: formatCurrency(fin.income?.total), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Expected', value: formatCurrency(fin.income?.expected), icon: BarChart3, color: 'text-[#007AFF]', bg: 'bg-sky-50', border: 'border-sky-100' },
        { label: 'Outstanding', value: formatCurrency(fin.income?.unpaid), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        { label: 'Total Expenses', value: formatCurrency(fin.expenses?.total), icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Net Income', value: formatCurrency(fin.netIncome), icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-900', border: 'border-slate-900', inverted: true },
        { label: `Commission (${fin.commission?.rate || 0}%)`, value: formatCurrency(fin.commission?.total), icon: Users, color: 'text-[#007AFF]', bg: 'bg-sky-50', border: 'border-sky-100' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header & Controls ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Monthly Property Report</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Income, expenses, and tenant payment status</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-all min-w-[200px]"
                        value={selectedProp}
                        onChange={e => setSelectedProp(e.target.value)}
                    >
                        {properties.map(p => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
                    </select>
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
                {loading ? <LoadingPage /> : !report ? (
                    <div className="bg-white rounded-lg border border-[#E2E8F0] p-12">
                        <EmptyState icon="📈" title="No report data" desc="Select a property and month to generate a report." />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {kpis.map(k => {
                                const Icon = k.icon;
                                const isNet = k.label === 'Net Income';
                                return (
                                    <div 
                                        key={k.label} 
                                        className={`rounded-lg border p-5 ${isNet ? 'bg-[#0F172A] border-[#0F172A]' : 'bg-white border-[#E2E8F0]'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${isNet ? 'bg-white/10 text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
                                                <Icon size={15} />
                                            </div>
                                            <span className={`text-[10px] font-medium uppercase tracking-widest ${isNet ? 'text-white/60' : 'text-[#64748B]'}`}>
                                                {k.label.split(' (')[0]}
                                            </span>
                                        </div>
                                        <p className={`text-lg font-semibold tracking-tight ${isNet ? 'text-white' : 'text-[#0F172A]'}`}>
                                            {k.value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Collection Progress */}
                        {fin.income?.expected > 0 && (
                            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-[15px] font-medium text-[#0F172A]">Collection Progress</h3>
                                        <p className="text-xs text-[#64748B] mt-0.5">{month}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-semibold ${collectionPct >= 80 ? 'text-[#16A34A]' : collectionPct >= 50 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                                            {collectionPct}%
                                        </span>
                                        <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest">Target Met</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${collectionPct >= 80 ? 'bg-[#16A34A]' : collectionPct >= 50 ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}
                                        style={{ width: `${collectionPct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-3 text-xs text-[#64748B]">
                                    <span className="font-medium text-[#0F172A]">{formatCurrency(fin.income?.total)} <span className="font-normal text-[#64748B]">collected</span></span>
                                    <span className="font-medium text-[#DC2626]">{formatCurrency(fin.income?.unpaid)} <span className="font-normal text-[#64748B]">outstanding</span></span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Expenses Breakdown */}
                            {fin.expenses?.byCategory && Object.keys(fin.expenses.byCategory).length > 0 && (
                                <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden flex flex-col h-full">
                                    <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                        <h3 className="text-xs font-medium text-[#0F172A] uppercase tracking-wider">Expenses Breakdown</h3>
                                    </div>
                                    <div className="flex-1 divide-y divide-[#F1F5F9]">
                                        {Object.entries(fin.expenses.byCategory).map(([cat, amt]) => (
                                            <div key={cat} className="flex justify-between items-center px-6 py-4">
                                                <span className="text-[13px] text-[#64748B]">{cat}</span>
                                                <span className="text-[13px] font-medium text-[#0F172A]">{formatCurrency(amt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                                        <span className="text-[13px] font-medium text-[#0F172A]">Total Expenses</span>
                                        <span className="text-[13px] font-semibold text-[#DC2626]">{formatCurrency(fin.expenses?.total)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Tenant Status Table */}
                            <div className={`bg-white rounded-lg border border-[#E2E8F0] overflow-hidden ${fin.expenses?.byCategory && Object.keys(fin.expenses.byCategory).length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                                    <h3 className="text-xs font-medium text-[#0F172A] uppercase tracking-wider">Tenant Status</h3>
                                    <span className="text-xs text-[#64748B]">{tenants.length} tenants total</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                {['Tenant', 'Unit', 'Expected', 'Paid', 'Outstanding', 'Status'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F5F9]">
                                            {tenants.map((t, i) => (
                                                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#0F172A]">{t.tenantName || t.name}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#64748B]">{t.unitCode || t.unitName || '—'}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#0F172A]">{formatCurrency(t.expectedAmount)}</td>
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#16A34A]">{formatCurrency(t.amountPaid)}</td>
                                                    <td className={`px-6 py-4 text-[13px] font-medium ${t.unpaidAmount > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                                                        {formatCurrency(t.unpaidAmount)}
                                                    </td>
                                                    <td className="px-6 py-4"><Badge status={t.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
