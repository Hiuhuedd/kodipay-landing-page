'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTenants, getMonthlyReport, getCurrentMonth, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, EmptyState, MonthPicker } from '@/components/ui';
import ManualPaymentModal from '@/components/ManualPaymentModal';
import { Search, User, CreditCard, ArrowRight } from 'lucide-react';

export default function RecordPaymentPage() {
    const [tenants, setTenants] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [history, setHistory] = useState([]); // Array of { month, map: { tenantId: st } }
    const [month, setMonth] = useState(getCurrentMonth());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [payTenant, setPayTenant] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Get last 6 months including current
            const monthsToFetch = [];
            let curr = month;
            for (let i = 0; i < 6; i++) {
                monthsToFetch.push(curr);
                const [y, m] = curr.split('-').map(Number);
                const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                curr = prev;
            }

            const [tenantData, ...reports] = await Promise.all([
                getTenants(),
                ...monthsToFetch.map(m => getMonthlyReport(m).catch(() => null))
            ]);

            const list = tenantData?.data || tenantData || [];
            setTenants(list);

            const historyData = [];
            reports.forEach((reportData, idx) => {
                const reportTenants = reportData?.data?.tenants || reportData?.report?.tenants || [];
                const map = {};
                reportTenants.forEach(t => { map[t.tenantId] = t; });

                if (idx === 0) setStatuses(map);
                historyData.push({ month: monthsToFetch[idx], map });
            });
            setHistory(historyData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = tenants.filter(t =>
        !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.unitCode?.toLowerCase().includes(search.toLowerCase()) ||
        t.phone?.includes(search)
    );

    // Sort: Outstanding first, then alphabetically
    const sorted = [...filtered].sort((a, b) => {
        const stA = statuses[a.id] || {};
        const stB = statuses[b.id] || {};
        const outA = (stA.expected || 0) - (stA.paid || 0);
        const outB = (stB.expected || 0) - (stB.paid || 0);

        if (outA > 0 && outB <= 0) return -1;
        if (outA <= 0 && outB > 0) return 1;
        return a.name.localeCompare(b.name);
    });

    if (loading) return <LoadingPage />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Record Payment</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Search for a tenant to record a new payment</p>
                </div>
                <MonthPicker value={month} onChange={setMonth} />
            </div>

            <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#007AFF] transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        className="w-full h-12 bg-white border border-[#E2E8F0] rounded-lg pl-12 pr-4 text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#007AFF] transition-all shadow-sm"
                        placeholder="Search by name, unit number, or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Tenants List */}
                <div className="grid grid-cols-1 gap-3">
                    {sorted.length === 0 ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center">
                            <EmptyState
                                icon="🔍"
                                title="No tenants found"
                                desc={search ? "We couldn't find any tenants matching your search." : "No tenants added yet."}
                            />
                        </div>
                    ) : (
                        sorted.map(t => {
                            const st = statuses[t.id] || {};
                            const outstanding = Math.max(0, (st.expectedAmount || st.expected || 0) - (st.amountPaid || st.paid || 0));

                            return (
                                <button
                                    key={t.id}
                                    className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#007AFF] hover:bg-[#F8FAFC] transition-all group"
                                    onClick={() => setPayTenant(t)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] group-hover:bg-blue-50 group-hover:text-[#007AFF] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[14px] font-semibold text-[#0F172A]">{t.name}</p>
                                            <p className="text-[11px] text-[#64748B] uppercase tracking-wide mt-0.5">
                                                Unit {t.unitCode || '—'} · {t.propertyDetails?.propertyName || 'No Property'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 text-right">
                                        {t.arrears > 0 ? (
                                            <div className="flex flex-col items-end">
                                                <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-widest mb-1">Total Due</p>
                                                <p className="text-[15px] font-semibold text-[#DC2626] tabular-nums">{formatCurrency(t.arrears)}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] font-medium text-[#64748B] uppercase tracking-widest">Select to pay</span>
                                                    <ArrowRight size={10} className="text-[#94A3B8]" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-[#F0FDF4] rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                                <span className="text-[10px] font-semibold text-[#16A34A] uppercase tracking-widest">Cleared</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {payTenant && (
                <ManualPaymentModal
                    tenant={payTenant}
                    status={statuses[payTenant.id]}
                    onClose={() => setPayTenant(null)}
                    onSuccess={load}
                />
            )}
        </div>
    );
}
