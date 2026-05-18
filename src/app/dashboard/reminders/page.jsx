'use client';

import { useState, useEffect, useMemo } from 'react';
import { getOverduePayments, sendReminders, getCurrentMonth, formatCurrency, getStats } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, EmptyState, ConfirmModal, Toast } from '@/components/ui';
import { Bell, CheckCircle2, AlertTriangle, Users, Landmark, UserCheck, Send, FileText } from 'lucide-react';

/* ─── Summary Card Component ──────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, colorClass }) {
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4 shadow-sm text-left">
            <div className={`p-3 rounded-lg border flex items-center justify-center ${colorClass || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xl font-semibold text-[#0F172A] tracking-tight">{value}</p>
            </div>
        </div>
    );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function RemindersPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedTenants, setSelectedTenants] = useState([]);
    const [confirmSend, setConfirmSend] = useState(null);
    const [toast, setToast] = useState(null);

    const refreshData = async () => {
        try {
            const [overdueData, statsData] = await Promise.all([
                getOverduePayments(month),
                getStats(month)
            ]);
            
            const list = overdueData?.data?.tenants ?? overdueData?.data ?? overdueData;
            const tenantsArray = Array.isArray(list) ? list : [];
            setTenants(tenantsArray);
            setSelectedTenants(tenantsArray.map(t => t.tenantId || t.id));
            setStats(statsData?.data || statsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [month]);

    const toggleTenant = (id) => {
        if (selectedTenants.includes(id)) {
            setSelectedTenants(prev => prev.filter(t => t !== id));
        } else {
            setSelectedTenants(prev => [...prev, id]);
        }
    };

    const toggleAll = () => {
        if (selectedTenants.length === tenants.length) {
            setSelectedTenants([]);
        } else {
            setSelectedTenants(tenants.map(t => t.tenantId || t.id));
        }
    };

    const handleSend = () => {
        if (selectedTenants.length === 0) return alert('Please select at least one tenant to remind.');
        
        setConfirmSend({
            title: 'Send Payment Reminders',
            message: `Are you sure you want to send automated SMS payment reminders to ${selectedTenants.length} selected tenant(s)?`,
            confirmText: 'Yes, Send Messages',
            type: 'primary',
            onConfirm: async () => {
                setSending(true);
                setConfirmSend(null);
                try {
                    const r = await sendReminders(selectedTenants, month);
                    setResult(r.data || r);
                    setSent(true);
                    
                    const statsData = await getStats(`${month}&t=${Date.now()}`);
                    setStats(statsData?.data || statsData);
                } catch (e) {
                    console.error(e);
                    alert('Failed to send reminders. Please try again.');
                } finally {
                    setSending(false);
                }
            }
        });
    };

    // Calculate outstanding sum locally for instant metrics
    const totalOutstanding = useMemo(() => {
        return tenants.reduce((sum, t) => sum + (Number(t.remainingAmount || t.arrears) || 0), 0);
    }, [tenants]);

    const displayMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (loading) return <LoadingPage />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Send Reminders</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">{tenants.length} tenants with outstanding payments for {displayMonth}</p>
                </div>
                <div className="flex items-center gap-4">
                    {tenants.length > 0 && !sent && (
                        <button 
                            className="h-11 px-8 bg-slate-900 text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer" 
                            onClick={handleSend} 
                            disabled={sending || selectedTenants.length === 0}
                        >
                            {sending ? '⏳ Sending...' : <><Bell size={14} /> Dispatch Reminders ({selectedTenants.length})</>}
                        </button>
                    )}
                </div>
            </div>



            <div className="space-y-6">
                {sent && result && (
                    <div className={`rounded-lg border p-4 shadow-sm transition-all ${
                        result.failed > 0 
                            ? (result.sent === 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-amber-50 border-amber-100 text-amber-900') 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-955'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded border flex items-center justify-center ${
                                result.sent > 0 ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-amber-100 text-amber-600 border-amber-200'
                            }`}>
                                {result.sent > 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </div>
                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                                    {result.sent > 0 ? 'Reminders processed successfully' : 'Action complete, but no messages were sent'}
                                </h4>
                                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-0.5">
                                    {result.sent || result.sentCount || 0} messages dispatched · {result.failed || 0} failed.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {tenants.length === 0 ? (
                    <div className="bg-white rounded-lg border border-[#E2E8F0] p-20 text-center shadow-sm">
                        <EmptyState icon="🎉" title="All payments up to date" desc="No tenants with outstanding payments for the current month." />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-[#0F172A] tracking-wider uppercase flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    Outstanding Payments Portfolio
                                </h3>
                                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">Select accounts to queue SMS dunning notifications</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#007AFF] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedTenants.length} selected</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-6 py-3.5 w-12 text-center border-b border-[#E2E8F0]">
                                            <input 
                                                type="checkbox" 
                                                checked={tenants.length > 0 && selectedTenants.length === tenants.length}
                                                onChange={toggleAll}
                                                className="w-4 h-4 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 transition-all cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Tenant & Unit</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Contact</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] text-right">Amount Due</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {tenants.map((t, i) => {
                                        const isSelected = selectedTenants.includes(t.tenantId || t.id);
                                        return (
                                            <tr 
                                                key={i} 
                                                className={`transition-all group hover:bg-[#F8FAFC] cursor-pointer ${isSelected ? "bg-blue-50/15" : ""}`}
                                                onClick={() => toggleTenant(t.tenantId || t.id)}
                                            >
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => toggleTenant(t.tenantId || t.id)}
                                                        className="w-4 h-4 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 transition-all cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#007AFF] transition-colors">
                                                        {t.name || t.tenantName}
                                                    </div>
                                                    <div className="flex flex-col mt-0.5">
                                                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t.unitCode || t.unitName || '—'}</span>
                                                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">{t.propertyName || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider tabular-nums">
                                                        {t.phone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-[13px] font-bold text-rose-600 tracking-tight">
                                                        {formatCurrency(t.remainingAmount || t.arrears)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                                        {t.paymentStatus || 'Arrears'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {confirmSend && (
                <ConfirmModal 
                    title={confirmSend.title}
                    message={confirmSend.message}
                    confirmText={confirmSend.confirmText}
                    type={confirmSend.type}
                    onConfirm={confirmSend.onConfirm}
                    onCancel={() => setConfirmSend(null)}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
