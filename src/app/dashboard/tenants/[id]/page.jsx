'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Calendar, User, Building2, CreditCard, DollarSign, ArrowUpRight, TrendingUp, Bell, Trash2, Loader2 } from 'lucide-react';
import { getTenantById, getMonthlyReport, deleteTenant, sendReminders, getCurrentMonth, formatCurrency, formatDate } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, MonthPicker, ConfirmModal } from '@/components/ui';

export default function TenantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState(null);
    const [statement, setStatement] = useState(null);
    const [month, setMonth] = useState(getCurrentMonth());
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [reminderSent, setReminderSent] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteTenant = async () => {
        if (!tenant) return;
        setDeleting(true);
        try {
            await deleteTenant(tenant.id);
            router.push('/dashboard/tenants');
        } catch (err) {
            console.error('[TENANT DETAIL] Failed to delete tenant:', err);
            alert('Failed to delete tenant. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSendReminder = async () => {
        if (!tenant) return;
        setSending(true);
        try {
            await sendReminders([tenant.id], month);
            setReminderSent(true);
            setTimeout(() => setReminderSent(false), 3000);
            
            // Trigger dynamic SMS counter refresh on the header
            window.dispatchEvent(new Event('kp_sms_updated'));
        } catch (err) { 
            console.error('[TENANT DETAIL] Failed to send reminder:', err); 
            alert('Failed to send SMS reminder.');
        } finally { 
            setSending(false); 
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [tenantData, reportData] = await Promise.all([
                    getTenantById(id),
                    getMonthlyReport(month).catch(() => null),
                ]);
                setTenant(tenantData?.data || tenantData);

                const tenants = reportData?.data?.tenants || reportData?.report?.tenants || [];
                const st = tenants.find(t => t.tenantId === id) || null;
                setStatement(st);
            } catch (e) { 
                console.error('[TENANT DETAIL] Load failed:', e); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, [id, month]);

    if (loading) return <LoadingPage />;
    if (!tenant) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                    <User size={24} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Tenant not found</h3>
                <p className="text-xs text-[#64748B] mt-1">This tenant may have been deleted or the ID is invalid.</p>
                <Link href="/dashboard/tenants" className="mt-4 h-9 px-4 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={14} /> Back to Tenants
                </Link>
            </div>
        );
    }

    const paid = statement?.amountPaid || statement?.paid || 0;
    const expected = statement?.expectedAmount || statement?.expected || 0;
    const remaining = statement?.unpaidAmount || statement?.remaining || Math.max(0, expected - paid);
    const payments = statement?.payments || [];
    const displayMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F1F5F9] pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-bold uppercase tracking-widest mb-2">
                        <User size={12} />
                        <span>Tenant Profile</span>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">{tenant.name}</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest flex items-center gap-2 font-medium">
                        <Building2 size={12} className="text-[#94A3B8]" />
                        <span>Unit {tenant.unitCode || tenant.unitName || '—'}</span>
                        <span className="text-[#E2E8F0]">•</span>
                        <span>{tenant.propertyDetails?.propertyName || '—'}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link 
                        href="/dashboard/tenants" 
                        className="h-9 px-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <div className="relative">
                        <MonthPicker value={month} onChange={setMonth} />
                    </div>
                    {remaining > 0 && (
                        <button 
                            onClick={handleSendReminder}
                            disabled={sending}
                            className="h-9 px-4 bg-white border border-red-200 text-red-600 rounded-md text-[13px] font-semibold hover:bg-red-50 transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                            {reminderSent ? 'Reminder Sent!' : 'Send Reminder'}
                        </button>
                    )}
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-9 px-4 bg-white border border-rose-200 text-rose-600 rounded-md text-[13px] font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <Trash2 size={14} /> Delete Tenant
                    </button>
                    <a 
                        href={`tel:${tenant.phone}`} 
                        className="h-9 px-4 bg-[#0F172A] text-white rounded-md text-[13px] font-semibold hover:bg-black transition-colors inline-flex items-center gap-2 shadow-sm"
                    >
                        <Phone size={14} /> Call Tenant
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Tenant Info Card ── */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User size={14} className="text-[#94A3B8]" />
                        Tenant Details
                    </h3>
                    
                    <div className="divide-y divide-[#F1F5F9]">
                        {[
                            { label: 'Phone Number', value: tenant.phone },
                            { label: 'Unit Code', value: tenant.unitCode || tenant.unitName },
                            { label: 'Assigned Property', value: tenant.propertyDetails?.propertyName },
                            { label: 'Move-in Date', value: formatDate(tenant.moveInDate) },
                            { 
                                label: 'Global Arrears', 
                                value: formatCurrency(tenant.arrears), 
                                colorClass: tenant.arrears > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold' 
                            },
                        ].map(r => r.value && (
                            <div key={r.label} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                                <span className="text-[13px] text-[#64748B] font-medium">{r.label}</span>
                                <span className={`text-[13px] font-semibold ${r.colorClass || 'text-[#0F172A]'}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Monthly Statement Card ── */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-[#94A3B8]" />
                                Statement for {displayMonth}
                            </h3>
                            <Badge status={statement?.status || 'Unpaid'} />
                        </div>

                        {/* Highlight Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                                { label: 'Expected', value: formatCurrency(expected), colorClass: 'text-[#0F172A]' },
                                { label: 'Paid', value: formatCurrency(paid), colorClass: 'text-[#007AFF]' },
                                { label: 'Remaining', value: formatCurrency(remaining), colorClass: remaining > 0 ? 'text-red-600' : 'text-[#64748B]' },
                            ].map(s => (
                                <div key={s.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center">
                                    <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">{s.label}</div>
                                    <div className={`text-[13px] font-bold tracking-tight mt-1.5 truncate ${s.colorClass}`}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[#64748B] font-medium">Collection Progress</span>
                                <span className="font-bold text-[#16A34A] flex items-center gap-1">
                                    <TrendingUp size={12} />
                                    {expected > 0 ? Math.round((paid / expected) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, expected > 0 ? (paid / expected) * 100 : 0)}%` }}
                                />
                            </div>
                        </div>

                        {/* Allocation Details */}
                        {statement?.breakdown && Object.keys(statement.breakdown).length > 0 && (
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                                    Allocated Items
                                </div>
                                {Object.entries(statement.breakdown)
                                    .filter(([_, val]) => val > 0)
                                    .map(([key, val]) => {
                                        let label = key;
                                        if (key === 'garbageFee') label = 'Garbage Fee';
                                        else if (key === 'waterBill') label = 'Water Bill';
                                        else if (key === 'electricityBill') label = 'Electricity Bill';
                                        else if (key === 'rent') label = 'Rent';
                                        else if (key === 'deposit') label = 'Deposit';
                                        else if (key === 'penalties') label = 'Penalties';
                                        
                                        return (
                                            <div key={key} className="flex justify-between items-center text-xs">
                                                <span className="text-[#64748B] capitalize">{label}</span>
                                                <span className="font-semibold text-[#0F172A]">{formatCurrency(val)}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* Excess Credit Note */}
                    {statement?.excess > 0 && (
                        <div className="mt-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3.5 flex items-center justify-between text-xs text-[#16A34A] font-medium">
                            <div className="flex items-center gap-2">
                                <ArrowUpRight size={14} />
                                <span>Excess (Ledger Credit)</span>
                            </div>
                            <span className="font-bold text-[13px]">{formatCurrency(statement.excess)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Transaction History Card ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                        <CreditCard size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Payment Ledger</h3>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-medium mt-0.5">History of receipts for {displayMonth}</p>
                    </div>
                </div>

                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Transaction ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Date</th>
                                    <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {payments.map((p, i) => (
                                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
                                                {p.transactionId || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-[#64748B]">
                                            {p.createdAt ? formatDate(p.createdAt) : p.date ? formatDate(p.date) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[13px] font-bold text-[#16A34A] text-right">
                                            {formatCurrency(p.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-[13px] text-[#64748B]">
                        No payments recorded for {displayMonth}.
                    </div>
                )}
            </div>
            {showDeleteConfirm && (
                <ConfirmModal
                    title="Delete Tenant"
                    message={`Are you sure you want to delete ${tenant.name}? This will vacate Unit ${tenant.unitCode || '—'} and completely delete their tenant records. This action cannot be undone.`}
                    confirmText={deleting ? 'Deleting...' : 'Delete'}
                    cancelText="Cancel"
                    type="danger"
                    onConfirm={handleDeleteTenant}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}
