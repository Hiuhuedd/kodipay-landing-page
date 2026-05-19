'use client';

import { useState, useEffect } from 'react';
import { getProperties, getPropertyReport, getCurrentMonth, formatCurrency, downloadPropertyReportPdf, formatDate } from '@/lib/api';
import { LoadingPage, EmptyState } from '@/components/ui';
import { FileDown, Calendar, Shield, CreditCard, ChevronRight, Check, DollarSign, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MonthlyReportPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('');
    const [report, setReport] = useState(null);
    
    const [reportColor, setReportColor] = useState('#007aff');
    const [loading, setLoading] = useState(false);
    const [propsLoading, setPropsLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const pathname = usePathname();

    const handleDownload = async () => {
        if (!pdfUrl) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('kp_token');
            const res = await fetch(pdfUrl, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const propertyName = report?.property?.name || 'Property';
            a.download = `Report_${propertyName.replace(/\s+/g, '_')}_${month}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Direct download failed, falling back to new tab:", err);
            window.open(pdfUrl, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    // 1. Fetch properties on load
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

    // 2. Fetch property report when property or month changes
    useEffect(() => {
        if (!selectedProp) return;
        setLoading(true);
        getPropertyReport(selectedProp, month)
            .then(d => setReport(d?.data || d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedProp, month]);

    if (propsLoading) return <LoadingPage />;

    const pdfUrl = selectedProp 
        ? `${downloadPropertyReportPdf(selectedProp, month)}?reportColor=${encodeURIComponent(reportColor)}`
        : null;

    const tabs = [
        { href: '/dashboard/reports/portfolio', label: 'Portfolio Report' },
        { href: '/dashboard/reports/monthly', label: 'Monthly Property Report' },
        { href: '/dashboard/reports/tenant', label: 'Tenant Statement' },
        { href: '/dashboard/reports/client', label: 'Client Report' }
    ];

    const fin = report?.financials || {};
    const tenants = report?.tenants || [];
    const meta = report?.meta || {};
    const propDetails = report?.property || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Monthly Property Report</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Generate print-ready financial statements for any managed asset</p>
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

                        {/* Property Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Property</label>
                            <select
                                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-all"
                                value={selectedProp}
                                onChange={e => setSelectedProp(e.target.value)}
                            >
                                <option value="" disabled>Choose a property...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.propertyName || p.name}</option>
                                ))}
                            </select>
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
                    {selectedProp && report && (
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
                                    <button
                                        type="button"
                                        disabled={downloading}
                                        onClick={handleDownload}
                                        className="flex items-center justify-center gap-2 w-full h-10 bg-[#007AFF] hover:bg-blue-600 text-white disabled:bg-blue-400 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shadow-blue-100 cursor-pointer"
                                    >
                                        {downloading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white" />
                                        ) : (
                                            <FileDown size={14} />
                                        )}
                                        {downloading ? 'Downloading...' : 'Download PDF Statement'}
                                    </button>
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
                            <span className="text-xs text-[#64748B] font-medium mt-3 uppercase tracking-widest animate-pulse">Compiling financial statement...</span>
                        </div>
                    ) : !report ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg">
                            <EmptyState
                                icon="📋"
                                title="No statement loaded"
                                desc="Select a property and choose a reporting month from the left sidebar to preview the financial statement."
                            />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm max-w-[680px] mx-auto animate-in fade-in duration-500">
                            {/* Live Statement Header */}
                            <div className="p-8 text-white transition-all" style={{ backgroundColor: reportColor }}>
                                <div className="text-center pb-5 mb-5 border-b border-white/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{meta.agency?.name || 'KodiPay Agency'}</h4>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mt-1">Monthly Financial Statement</h3>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">{propDetails.name}</h2>
                                        <p className="text-xs text-white/90 mt-1 font-medium">
                                            Owner: {meta.owner?.name || 'Private Client'} • {propDetails.summary || '0 Units Managed'}
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
                                {/* Tenant Payment Schedule */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Tenant Payment Schedule</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2 uppercase tracking-wider">Unit</th>
                                                    <th className="py-2 uppercase tracking-wider">Tenant</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Rent</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Water</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Garb.</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Elec.</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Paid</th>
                                                    <th className="py-2 text-right uppercase tracking-wider">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {tenants.length > 0 ? (
                                                    tenants.map((t, idx) => {
                                                        const water = t.utilityFees?.waterBill || 0;
                                                        const garbage = t.utilityFees?.garbageFee || 0;
                                                        const electricity = t.utilityFees?.electricityBill || 0;
                                                        const rent = (t.expectedAmount || 0) - water - garbage - electricity;
                                                        return (
                                                            <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                                <td className="py-3 text-[#334155] font-semibold">{t.unitName}</td>
                                                                <td className="py-3 text-[#334155]">{t.tenantName}</td>
                                                                <td className="py-3 text-right tabular-nums">{formatCurrency(rent)}</td>
                                                                <td className="py-3 text-right tabular-nums">{formatCurrency(water)}</td>
                                                                <td className="py-3 text-right tabular-nums">{formatCurrency(garbage)}</td>
                                                                <td className="py-3 text-right tabular-nums">{formatCurrency(electricity)}</td>
                                                                <td className="py-3 text-right font-medium text-emerald-600 tabular-nums">{formatCurrency(t.amountPaid)}</td>
                                                                <td className={`py-3 text-right font-bold tabular-nums ${
                                                                    t.unpaidAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                                }`}>
                                                                    {formatCurrency(t.unpaidAmount)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="py-6 text-center text-[#64748B] italic">No active tenant schedules logged for this period.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-[#E2E8F0]" />

                                {/* Side-by-Side Financial Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                    {/* Left: Income Summary */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9] pb-2">Income Summary</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between text-[#334155]">
                                                <span>Total Expected</span>
                                                <span className="font-semibold tabular-nums">{formatCurrency(fin.income?.expected)}</span>
                                            </div>
                                            <div className="flex justify-between text-rose-600">
                                                <span>Total Unpaid</span>
                                                <span className="font-semibold tabular-nums">{formatCurrency(fin.income?.unpaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-[#0F172A] border-t border-[#F1F5F9] pt-2 font-bold text-sm">
                                                <span>Rent Collections</span>
                                                <span className="tabular-nums">{formatCurrency(fin.income?.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Expenses & Commission */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9] pb-2">Operating Expenses</h4>
                                        <div className="space-y-2 text-xs">
                                            {fin.expenses?.items && fin.expenses.items.map((item, index) => (
                                                <div key={index} className="flex justify-between text-[#334155]">
                                                    <span>{item.name}</span>
                                                    <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-[#334155]">
                                                <span>Management Fee ({fin.commission?.rate || 8}%)</span>
                                                <span className="font-semibold tabular-nums">{formatCurrency(fin.commission?.total)}</span>
                                            </div>
                                            <div className="flex justify-between text-[#0F172A] border-t border-[#F1F5F9] pt-2 font-bold text-sm">
                                                <span>Total Expenses</span>
                                                <span className="tabular-nums">{formatCurrency(fin.expenses?.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-[#E2E8F0] pt-4" />

                                {/* Bottom Executive Summary Box */}
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">NET MONTHLY INCOME</span>
                                        <h3 className="text-xl font-black mt-1 tabular-nums transition-all" style={{ color: reportColor }}>
                                            {formatCurrency(fin.netIncome)}
                                        </h3>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Collection Rate</span>
                                        <span className="text-sm font-bold text-[#0F172A] mt-1 block">
                                            {fin.income?.expected > 0 ? Math.round((fin.income.total / fin.income.expected) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Footer info block */}
                                <div className="text-center space-y-1 text-[11px] text-[#94A3B8] pt-4">
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
