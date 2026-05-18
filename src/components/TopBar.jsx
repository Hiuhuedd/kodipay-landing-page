'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Building2, User, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getProperties, getTenants, getMonthlyReport, getCurrentMonth, formatCurrency } from '@/lib/api';

export default function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    // Live search states
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ properties: [], tenants: [], transactions: [] });
    const searchRef = useRef(null);

    // Fetch master list for offline-first instant local search
    const loadSearchData = async () => {
        if (data.properties.length > 0 || loading) return;
        setLoading(true);
        try {
            const currentMonth = getCurrentMonth();
            const [propertiesData, tenantsData, reportData] = await Promise.all([
                getProperties().catch(() => []),
                getTenants().catch(() => []),
                getMonthlyReport(currentMonth).catch(() => null),
            ]);

            const props = propertiesData?.data || propertiesData || [];
            const tnts = tenantsData?.data || tenantsData || [];
            
            // Extract payments/transactions list
            const reportTenants = reportData?.data?.tenants || reportData?.report?.tenants || [];
            const txs = reportTenants.flatMap(t => 
                (t.payments || []).map(p => ({
                    ...p,
                    tenantName: t.name || t.tenantName,
                    unitCode: t.unitCode
                }))
            );

            setData({
                properties: props,
                tenants: tnts,
                transactions: txs
            });
        } catch (err) {
            console.error('Failed to load search index:', err);
        } finally {
            setLoading(false);
        }
    };

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter data instantly on query
    const getFilteredResults = () => {
        if (!query.trim()) return { properties: [], tenants: [], transactions: [] };
        const q = query.toLowerCase();

        return {
            properties: data.properties.filter(p => 
                p.propertyName?.toLowerCase().includes(q) ||
                p.location?.toLowerCase().includes(q) ||
                p.address?.toLowerCase().includes(q)
            ).slice(0, 3),

            tenants: data.tenants.filter(t => 
                t.name?.toLowerCase().includes(q) ||
                t.phone?.includes(q) ||
                t.unitCode?.toLowerCase().includes(q)
            ).slice(0, 4),

            transactions: data.transactions.filter(tx => 
                tx.tenantName?.toLowerCase().includes(q) ||
                tx.unitCode?.toLowerCase().includes(q) ||
                tx.transactionCode?.toLowerCase().includes(q) ||
                tx.paymentMethod?.toLowerCase().includes(q)
            ).slice(0, 4)
        };
    };

    const results = getFilteredResults();
    const hasResults = results.properties.length > 0 || results.tenants.length > 0 || results.transactions.length > 0;

    // Map pathname to title
    const getTitle = () => {
        if (pathname === '/dashboard') return 'Dashboard';
        if (pathname?.includes('/properties')) return 'Properties';
        if (pathname?.includes('/tenants')) return 'Tenants';
        if (pathname?.includes('/transactions')) return 'Transactions';
        if (pathname?.includes('/reports')) return 'Reports';
        if (pathname?.includes('/settings')) return 'Settings';
        return 'KodiPay';
    };

    const handleSelect = (url) => {
        router.push(url);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <header className="h-14 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between relative z-40">
            <div className="flex items-center gap-4">
                <h1 className="text-[15px] font-semibold text-[#0F172A] tracking-tight">
                    {getTitle()}
                </h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Global Live Search Bar */}
                <div ref={searchRef} className="relative hidden xl:block w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
                    <input
                        type="text"
                        placeholder="Search Properties, Tenants, M-Pesa ref..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            loadSearchData();
                            setIsOpen(true);
                        }}
                        className="h-8 pl-9 pr-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all w-full"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] animate-spin" size={12} />
                    )}

                    {/* Search Dropdown Overlay */}
                    {isOpen && query.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto animate-zoom-in py-2">
                            {hasResults ? (
                                <div className="space-y-4">
                                    {/* Properties Group */}
                                    {results.properties.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1 text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] bg-[#F8FAFC]">
                                                Properties
                                            </div>
                                            <div className="divide-y divide-[#F1F5F9] px-1">
                                                {results.properties.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleSelect(`/dashboard/properties/${p.id}`)}
                                                        className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] rounded transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="w-7 h-7 rounded bg-[#F0F6FF] text-[#007AFF] flex items-center justify-center shrink-0">
                                                            <Building2 size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-[#0F172A] truncate">{p.propertyName}</p>
                                                            <p className="text-[10px] text-[#64748B] truncate">{p.location || p.address || 'Location unspecified'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tenants Group */}
                                    {results.tenants.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1 text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] bg-[#F8FAFC]">
                                                Tenants
                                            </div>
                                            <div className="divide-y divide-[#F1F5F9] px-1">
                                                {results.tenants.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleSelect(`/dashboard/tenants/${t.id}`)}
                                                        className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] rounded transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="w-7 h-7 rounded bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-[#0F172A] truncate">{t.name}</p>
                                                            <p className="text-[10px] text-[#64748B] truncate">Unit {t.unitCode} · {t.phone}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Transactions Group */}
                                    {results.transactions.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1 text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] bg-[#F8FAFC]">
                                                Transactions
                                            </div>
                                            <div className="divide-y divide-[#F1F5F9] px-1">
                                                {results.transactions.map((tx, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelect('/dashboard/transactions')}
                                                        className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] rounded transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                                            <CreditCard size={14} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex justify-between items-baseline">
                                                                <p className="text-xs font-semibold text-[#0F172A] truncate">{tx.tenantName}</p>
                                                                <p className="text-[11px] font-bold text-[#16A34A] shrink-0">{formatCurrency(tx.amount)}</p>
                                                            </div>
                                                            <p className="text-[10px] text-[#64748B] truncate">
                                                                Ref: {tx.transactionCode || '—'} · Unit {tx.unitCode}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-[#64748B]">
                                    No matches found for "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Avatar */}
                <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#007AFF] hover:shadow-sm transition-all outline-none"
                >
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs font-semibold text-[#0F172A]">
                             {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
}
