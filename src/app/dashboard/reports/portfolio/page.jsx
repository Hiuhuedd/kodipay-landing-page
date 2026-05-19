'use client';

import { useState, useEffect } from 'react';
import { fetchAPI, getCurrentMonth, formatCurrency, downloadPortfolioReportPdf, formatDate } from '@/lib/api';
import { LoadingPage, EmptyState } from '@/components/ui';
import { FileDown, Calendar, Shield, CreditCard, ChevronRight, Check, Building2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PortfolioReportPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [report, setReport] = useState(null);
    
    const [reportColor, setReportColor] = useState('#007aff');
    const [loading, setLoading] = useState(true);

    const pathname = usePathname();

    // Fetch portfolio report data
    useEffect(() => {
        setLoading(true);
        fetchAPI(`/reports/portfolio/month/${month}`)
            .then(d => setReport(d?.data || d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month]);

    const pdfUrl = month 
        ? `${downloadPortfolioReportPdf(month)}?reportColor=${encodeURIComponent(reportColor)}`
        : null;

    const tabs = [
        { href: '/dashboard/reports/portfolio', label: 'Portfolio Report' },
        { href: '/dashboard/reports/monthly', label: 'Monthly Property Report' },
        { href: '/dashboard/reports/tenant', label: 'Tenant Statement' }
    ];

    const props = report?.properties || [];
    const summary = report?.summary || {};
    const meta = report?.meta || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Consolidated Portfolio Report</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Consolidated executive overview of all managed properties</p>
                </div>
            </div>

            {/* Reports Custom Sub-Tab Bar */}
            <div className="flex border-b border-[#E2E8F0]">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Configuration Sidebar (Left, 4 columns) ── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                            <div className="w-6 h-6 rounded bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
                                <Calendar size={14} />
                            </div>
                            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Configure Statement</h3>
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
                    {report && (
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

                            {pdfUrl && (
                                <div className="pt-2">
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shadow-blue-100"
                                    >
                                        <FileDown size={14} /> Download PDF Statement
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Statement Sheet Live Preview (Right, 8 columns) ── */}
                <div className="lg:col-span-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#E2E8F0] rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-[#007AFF]" />
                            <span className="text-xs text-[#64748B] font-medium mt-3 uppercase tracking-widest animate-pulse">Compiling portfolio overview...</span>
                        </div>
                    ) : !report || props.length === 0 ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg">
                            <EmptyState
                                icon="📋"
                                title="No statement loaded"
                                desc="Choose a reporting month from the left sidebar to preview the consolidated portfolio statement."
                            />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm max-w-[680px] mx-auto animate-in fade-in duration-500">
                            {/* Live Statement Header */}
                            <div className="p-8 text-white transition-all" style={{ backgroundColor: reportColor }}>
                                <div className="text-center pb-5 mb-5 border-b border-white/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{meta.agency?.name || 'KodiPay Agency'}</h4>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mt-1">Monthly Portfolio Statement</h3>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">All Properties</h2>
                                        <p className="text-xs text-white/90 mt-1 font-medium">
                                            Portfolio Scope: {summary.totalProperties || props.length} Active Managed Assets
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 block">Reporting Period</span>
                                        <span className="text-xs font-bold uppercase">
                                            {new Date(month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="p-8 space-y-6">
                                {/* Aggregated KPI blocks */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Total Expected</span>
                                        <span className="text-base font-bold text-slate-800 block mt-1 tabular-nums">{formatCurrency(summary.totalExpected)}</span>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Total Collected</span>
                                        <span className="text-base font-bold text-emerald-600 block mt-1 tabular-nums">{formatCurrency(summary.totalCollected)}</span>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-center">
                                        <span className="text-[9px] font-black text-rose-800 uppercase tracking-wider block">Total Unpaid</span>
                                        <span className="text-base font-bold text-rose-600 block mt-1 tabular-nums">{formatCurrency(summary.totalUnpaid)}</span>
                                    </div>
                                </div>

                                {/* Property Breakdown table */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Property Breakdown</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2.5 uppercase tracking-wider">Property</th>
                                                    <th className="py-2.5 uppercase tracking-wider">Owner</th>
                                                    <th className="py-2.5 text-center uppercase tracking-wider">Occ.</th>
                                                    <th className="py-2.5 text-right uppercase tracking-wider">Expected</th>
                                                    <th className="py-2.5 text-right uppercase tracking-wider">Collected</th>
                                                    <th className="py-2.5 text-right uppercase tracking-wider">Unpaid</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {props.map((p, idx) => (
                                                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                        <td className="py-3 text-[#334155] font-semibold">{p.name}</td>
                                                        <td className="py-3 text-[#64748B]">{p.owner || '—'}</td>
                                                        <td className="py-3 text-center text-[#334155] font-medium tabular-nums">{p.occupied}/{p.units}</td>
                                                        <td className="py-3 text-right tabular-nums">{formatCurrency(p.expected)}</td>
                                                        <td className="py-3 text-right font-medium text-emerald-600 tabular-nums">{formatCurrency(p.collected)}</td>
                                                        <td className={`py-3 text-right font-bold tabular-nums ${
                                                            p.unpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                        }`}>
                                                            {formatCurrency(p.unpaid)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-[#E2E8F0]" />

                                {/* Executive Summary Box */}
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Portfolio Occupancy Rate</span>
                                        <h3 className="text-lg font-black mt-1 text-[#0F172A]">
                                            {props.reduce((acc, curr) => acc + (curr.units || 0), 0) > 0 
                                                ? Math.round((props.reduce((acc, curr) => acc + (curr.occupied || 0), 0) / props.reduce((acc, curr) => acc + (curr.units || 0), 0)) * 100)
                                                : 0}% Occupied
                                        </h3>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Collection Rate</span>
                                        <span className="text-base font-bold text-emerald-600 mt-1 block">
                                            {summary.totalExpected > 0 ? Math.round((summary.totalCollected / summary.totalExpected) * 100) : 0}% Collected
                                        </span>
                                    </div>
                                </div>

                                {/* Footer info block */}
                                <div className="text-center space-y-1 text-[11px] text-[#94A3B8] pt-2">
                                    <p className="font-semibold text-[#64748B]">Generated by {meta.agency?.name}</p>
                                    {meta.agency?.contact && (
                                        <p>Enquiries / Support: {meta.agency.contact}</p>
                                    )}
                                    <p className="text-[10px] pt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
