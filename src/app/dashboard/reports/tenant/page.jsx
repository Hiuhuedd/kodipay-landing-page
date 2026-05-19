'use client';

import { useState, useEffect } from 'react';
import { getProperties, getTenants, getTenantStatement, formatCurrency, downloadTenantStatementPdf, formatDate } from '@/lib/api';
import { LoadingPage, EmptyState } from '@/components/ui';
import { FileDown, Search, Users, Shield, Calendar, CreditCard, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TenantStatementPage() {
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [tenants, setTenants] = useState([]);
    const [filteredTenants, setFilteredTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [statement, setStatement] = useState(null);
    const [reportColor, setReportColor] = useState('#007aff');
    const [loadingProps, setLoadingProps] = useState(true);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [loadingStatement, setLoadingStatement] = useState(false);
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
            a.download = `Statement_${statement?.tenant?.name?.replace(/\s+/g, '_') || 'Tenant'}.pdf`;
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
                if (list.length > 0) setSelectedProperty(list[0].id);
            })
            .catch(console.error)
            .finally(() => setLoadingProps(false));
    }, []);

    // 2. Fetch tenants when property selection changes
    useEffect(() => {
        if (!selectedProperty) return;
        setLoadingTenants(true);
        setSelectedTenant('');
        setStatement(null);
        getTenants()
            .then(d => {
                const all = d?.data || d || [];
                const filtered = all.filter(t => t.propertyId === selectedProperty);
                setTenants(filtered);
                setFilteredTenants(filtered);
            })
            .catch(console.error)
            .finally(() => setLoadingTenants(false));
    }, [selectedProperty]);

    // 3. Search filter for tenants list
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTenants(tenants);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = tenants.filter(t =>
                (t.name || '').toLowerCase().includes(query) ||
                (t.phone || '').includes(query) ||
                (t.unitName || t.unitCode || '').toLowerCase().includes(query)
            );
            setFilteredTenants(filtered);
        }
    }, [searchQuery, tenants]);

    // 4. Load tenant statement details when a tenant is chosen
    useEffect(() => {
        if (!selectedTenant) {
            setStatement(null);
            return;
        }
        setLoadingStatement(true);
        getTenantStatement(selectedTenant)
            .then(d => {
                setStatement(d?.data || d);
            })
            .catch(console.error)
            .finally(() => setLoadingStatement(false));
    }, [selectedTenant]);

    if (loadingProps) return <LoadingPage />;

    const pdfUrl = selectedTenant 
        ? `${downloadTenantStatementPdf(selectedTenant)}?reportColor=${encodeURIComponent(reportColor)}`
        : null;

    const tabs = [
        { href: '/dashboard/reports/portfolio', label: 'Portfolio Report' },
        { href: '/dashboard/reports/monthly', label: 'Monthly Property Report' },
        { href: '/dashboard/reports/tenant', label: 'Tenant Statement' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Tenant Statement of Account</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Generate high-fidelity statement of transactions for any tenant</p>
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
                    {/* Property & Tenant Picker Card */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
                            <div className="w-6 h-6 rounded bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
                                <Users size={14} />
                            </div>
                            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Configure Statement</h3>
                        </div>

                        {/* Property Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Property</label>
                            <select
                                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-all"
                                value={selectedProperty}
                                onChange={e => setSelectedProperty(e.target.value)}
                            >
                                <option value="" disabled>Choose a property...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.propertyName || p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Query */}
                        {selectedProperty && (
                            <div className="space-y-1.5 pt-2">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Find Tenant</label>
                                <div className="relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                                    <input
                                        type="text"
                                        className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#007AFF] transition-all"
                                        placeholder="Search name, phone, or unit..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tenants List */}
                        {selectedProperty && (
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Tenant</label>
                                <div className="max-h-[220px] overflow-y-auto border border-[#E2E8F0] rounded-md divide-y divide-[#F1F5F9] overflow-x-hidden">
                                    {loadingTenants ? (
                                        <div className="p-4 text-center text-xs text-[#64748B]">Loading property tenants...</div>
                                    ) : filteredTenants.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-[#64748B]">No matching tenants found.</div>
                                    ) : (
                                        filteredTenants.map(t => {
                                            const active = selectedTenant === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setSelectedTenant(t.id)}
                                                    className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                                                        active ? 'bg-blue-50/70 text-[#007AFF]' : 'hover:bg-[#F8FAFC] text-[#334155]'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="text-xs font-semibold">{t.name}</div>
                                                        <div className="text-[10px] text-[#64748B] mt-0.5">Unit: {t.unitName || t.unitCode || '—'}</div>
                                                    </div>
                                                    {active && <Check size={14} className="text-[#007AFF]" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Branding options card */}
                    {selectedTenant && (
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

                {/* ── Receipt/Statement Live Preview (Right, 8 columns) ── */}
                <div className="lg:col-span-8">
                    {loadingStatement ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#E2E8F0] rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-[#007AFF]" />
                            <span className="text-xs text-[#64748B] font-medium mt-3 uppercase tracking-widest animate-pulse">Compiling statement records...</span>
                        </div>
                    ) : !statement ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg">
                            <EmptyState
                                icon="📋"
                                title="No statement loaded"
                                desc="Select a property and then a tenant from the left sidebar to preview their dynamic ledger statement."
                            />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm max-w-[680px] mx-auto animate-in fade-in duration-500">
                            {/* Live Statement Header */}
                            <div className="p-8 text-white transition-all" style={{ backgroundColor: reportColor }}>
                                <div className="text-center pb-5 mb-5 border-b border-white/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{statement.meta?.agency?.name || 'KodiPay Agency'}</h4>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mt-1">Statement of Account</h3>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">{statement.tenant?.name}</h2>
                                        <p className="text-xs text-white/90 mt-1 font-medium">
                                            Unit: {statement.tenant?.unitName || statement.tenant?.unitCode} • {statement.tenant?.propertyName || 'Property Asset'}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 block">Move-In Date</span>
                                        <span className="text-xs font-bold">{formatDate(statement.tenant?.moveInDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="p-8 space-y-6">
                                {/* Summary KPIs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Total Amount Paid</span>
                                        <span className="text-lg font-bold text-emerald-600 block mt-1.5">{formatCurrency(statement.summary?.totalPaid)}</span>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 text-center">
                                        <span className="text-[9px] font-black text-rose-800 uppercase tracking-wider block">Outstanding Balance</span>
                                        <span className="text-lg font-bold text-rose-600 block mt-1.5">{formatCurrency(statement.summary?.balance)}</span>
                                    </div>
                                </div>

                                {/* Transaction History list */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">Transaction Ledger History</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                                    <th className="py-2.5 uppercase tracking-wider">Date</th>
                                                    <th className="py-2.5 uppercase tracking-wider">Ref Code</th>
                                                    <th className="py-2.5 uppercase tracking-wider">Type</th>
                                                    <th className="py-2.5 uppercase tracking-wider">Status</th>
                                                    <th className="py-2.5 text-right uppercase tracking-wider">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                {statement.transactions && statement.transactions.length > 0 ? (
                                                    statement.transactions.map((t, idx) => (
                                                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                                                            <td className="py-3 text-[#334155] whitespace-nowrap">{formatDate(t.date)}</td>
                                                            <td className="py-3 text-[#64748B] font-mono whitespace-nowrap">{t.transactionCode || t.mpesaReceiptNumber || '—'}</td>
                                                            <td className="py-3 text-[#334155] font-medium whitespace-nowrap">
                                                                {(t.type || 'payment').replace('_', ' ').toUpperCase()}
                                                            </td>
                                                            <td className="py-3 whitespace-nowrap">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    (t.status || 'paid').toLowerCase() === 'paid' 
                                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                                        : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                    {t.status || 'PAID'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-right font-bold text-[#0F172A] whitespace-nowrap">{formatCurrency(t.amount)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-6 text-center text-[#64748B] italic">No transaction records found for this tenant statement.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-[#E2E8F0] pt-6" />

                                {/* Footer info block */}
                                <div className="text-center space-y-1 text-[11px] text-[#94A3B8]">
                                    <p className="font-semibold text-[#64748B]">Managed by {statement.meta?.agency?.name}</p>
                                    {statement.meta?.agency?.contact && (
                                        <p>Enquiries / Support: {statement.meta.agency.contact}</p>
                                    )}
                                    <p className="text-[10px] pt-2">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
