'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getTenants, getMonthlyReport, getProperties, getPropertyById, createTenant, deleteTenant, getCurrentMonth, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, EmptyState, MonthPicker, Modal, ConfirmModal } from '@/components/ui';
import ManualPaymentModal from '@/components/ManualPaymentModal';
import OnboardTenantModal from '@/components/OnboardTenantModal';
import { UserPlus, Search, ArrowRight, CreditCard, Trash2, X } from 'lucide-react';

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [month, setMonth] = useState(getCurrentMonth());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [payTenant, setPayTenant] = useState(null);
    const [deletingTenant, setDeletingTenant] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [tenantData, reportData, propsData] = await Promise.all([
                getTenants(),
                getMonthlyReport(month).catch(() => null),
                getProperties().catch(() => []),
            ]);
            const list = tenantData?.data || tenantData || [];
            setTenants(list);
            setProperties(propsData?.data || propsData || []);
            const reportTenants = reportData?.data?.tenants || reportData?.report?.tenants || [];
            const map = {};
            reportTenants.forEach(t => { map[t.tenantId] = t; });
            setStatuses(map);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [month]);

    useEffect(() => { load(); }, [load]);

    const handleDeleteTenant = async () => {
        if (!deletingTenant) return;
        try {
            await deleteTenant(deletingTenant.id);
            setDeletingTenant(null);
            load();
        } catch (e) {
            console.error(e);
            alert('Failed to delete tenant. Please try again.');
        }
    };


    const filtered = tenants.filter(t =>
        !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.unitCode?.toLowerCase().includes(search.toLowerCase()) ||
        t.phone?.includes(search)
    );

    if (loading) return <LoadingPage />;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Tenants</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">{tenants.length} active tenants total</p>
                </div>

                <div className="flex items-center gap-3">
                    <MonthPicker value={month} onChange={setMonth} />
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                        <UserPlus size={14} /> Add Tenant
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input
                        className="w-full h-11 pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-lg focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                        placeholder="Search by name, unit, or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <EmptyState icon="👤" title="No tenants found" desc={search ? 'Try a different search term.' : 'No tenants have been added yet.'} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        {['Tenant', 'Unit & Property', 'Contact', 'Expected', 'Paid', 'Status', ''].map(h => (
                                            <th key={h} className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {filtered.map(t => {
                                        const st = statuses[t.id] || {};
                                        return (
                                            <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-[#F1F5F9] text-[#64748B] rounded flex items-center justify-center font-semibold text-xs shrink-0">
                                                            {t.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-[13px] font-medium text-[#0F172A]">{t.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[13px] font-medium text-[#0F172A] uppercase">{t.unitCode || t.unitName || '—'}</p>
                                                        <p className="text-[11px] text-[#64748B] uppercase">{t.propertyDetails?.propertyName || '—'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[13px] text-[#64748B] tabular-nums">{t.phone}</td>
                                                <td className="px-6 py-4 text-[13px] text-[#0F172A]">{formatCurrency(st.expectedAmount || st.expected)}</td>
                                                <td className="px-6 py-4 text-[13px] font-medium text-[#16A34A]">{formatCurrency(st.amountPaid || st.paid)}</td>
                                                <td className="px-6 py-4"><Badge status={st.status || 'Unpaid'} /></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setPayTenant(t)}
                                                            className="flex items-center gap-1.5 h-7 px-3 bg-white border border-[#E2E8F0] rounded text-[11px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                                                        >
                                                            <CreditCard size={11} /> Pay
                                                        </button>
                                                        <Link
                                                            href={`/dashboard/tenants/${t.id}`}
                                                            className="flex items-center gap-1.5 h-7 px-3 bg-[#0F172A] text-white rounded text-[11px] font-medium hover:bg-black transition-colors"
                                                        >
                                                            View <ArrowRight size={11} />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeletingTenant(t)}
                                                            className="flex items-center gap-1.5 h-7 px-3 bg-white border border-rose-100 rounded text-[11px] font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={11} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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

            {showAddModal && (
                <OnboardTenantModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={load}
                />
            )}

            {deletingTenant && (
                <ConfirmModal
                    title="Delete Tenant"
                    message={`Are you sure you want to delete ${deletingTenant.name}? This will vacate Unit ${deletingTenant.unitCode || '—'} and completely delete their tenant records. This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                    onConfirm={handleDeleteTenant}
                    onCancel={() => setDeletingTenant(null)}
                />
            )}
        </div>
    );
}
