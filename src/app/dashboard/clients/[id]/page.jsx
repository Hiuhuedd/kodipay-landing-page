'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Phone, 
    Mail,
    Building2, 
    CreditCard, 
    DollarSign, 
    ArrowUpRight, 
    TrendingUp, 
    Trash2, 
    Loader2, 
    Search,
    Plus,
    X,
    TrendingDown,
    Briefcase,
    Calendar,
    Settings
} from 'lucide-react';
import { 
    fetchAPI, 
    formatCurrency, 
    formatDate, 
    getCurrentMonth 
} from '@/lib/api';
import { PageHeader, LoadingPage, Badge } from '@/components/ui';

export default function LandlordDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submittingPayout, setSubmittingPayout] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState('properties');
    
    // Payout Form State
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        payoutMonth: getCurrentMonth(),
        notes: ''
    });
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');

    const loadClientData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetchAPI(`/clients/${id}`);
            if (res.success) {
                setClient(res.data);
                // Pre-fill maximum outstanding payout amount
                setPayoutForm(prev => ({
                    ...prev,
                    amount: res.data.outstandingPayout > 0 ? res.data.outstandingPayout.toString() : ''
                }));
            }
        } catch (err) {
            console.error('Failed to load client details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadClientData();
    }, [loadClientData]);

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setModalSuccess('');

        const amountNum = parseFloat(payoutForm.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setModalError('Please enter a valid payout amount');
            return;
        }

        if (amountNum > client.outstandingPayout) {
            setModalError(`Amount exceeds outstanding payout of ${formatCurrency(client.outstandingPayout)}`);
            return;
        }

        setSubmittingPayout(true);
        try {
            const res = await fetchAPI(`/clients/${id}/payouts`, {
                method: 'POST',
                body: JSON.stringify(payoutForm)
            });

            if (res.success) {
                setModalSuccess('Payout recorded and receipt emailed to landlord successfully!');
                setTimeout(() => {
                    setShowPayoutModal(false);
                    setModalSuccess('');
                    setPayoutForm({
                        amount: '',
                        paymentMethod: 'mpesa',
                        referenceNumber: '',
                        payoutMonth: getCurrentMonth(),
                        notes: ''
                    });
                    loadClientData(true);
                }, 2000);
            }
        } catch (err) {
            setModalError(err.message || 'Failed to record payout');
        } finally {
            setSubmittingPayout(false);
        }
    };

    if (loading) return <LoadingPage />;

    if (!client) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                    <Briefcase size={24} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Landlord profile not found</h3>
                <p className="text-xs text-[#64748B] mt-1">This landlord profile may have been deleted or the ID is invalid.</p>
                <Link href="/dashboard/clients" className="mt-4 h-9 px-4 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={14} /> Back to Landlords
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F1F5F9] pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-bold uppercase tracking-widest mb-2">
                        <Briefcase size={12} />
                        <span>Landlord Client Profile</span>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">{client.name}</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest flex items-center gap-2 font-medium">
                        <Mail size={12} className="text-[#94A3B8]" />
                        <span>{client.email || 'No email provided'}</span>
                        <span className="text-[#E2E8F0]">•</span>
                        <Phone size={12} className="text-[#94A3B8]" />
                        <span>{client.phone || 'No phone provided'}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link 
                        href="/dashboard/clients" 
                        className="h-9 px-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> Back to Directory
                    </Link>
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        disabled={client.outstandingPayout <= 0}
                        className={`h-9 px-4 rounded-md text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${
                            client.outstandingPayout > 0
                            ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                            : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                        }`}
                    >
                        <ArrowUpRight size={14} /> Disburse Payout
                    </button>
                </div>
            </div>

            {/* ── Key Metrics Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Gross Collected</span>
                        <h3 className="text-lg font-bold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(client.totalCollected)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Expenses Incurred</span>
                        <h3 className="text-lg font-bold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(client.totalExpenses)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Total Disbursed</span>
                        <h3 className="text-lg font-bold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(client.totalPaid)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Outstanding (Net)</span>
                        <h3 className={`text-lg font-bold tracking-tight mt-0.5 ${client.outstandingPayout > 0 ? 'text-amber-600' : 'text-[#0F172A]'}`}>{formatCurrency(client.outstandingPayout)}</h3>
                    </div>
                </div>
            </div>

            {/* ── Remittance Details & Internal Notes ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm col-span-2">
                    <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CreditCard size={14} className="text-[#94A3B8]" />
                        Remittance & Payout Instructions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Preferred Remittance Method</span>
                            <span className="text-sm font-bold text-[#0F172A] uppercase block mt-1.5">{client.payoutMethod || 'M-Pesa'}</span>
                        </div>
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Remittance Details / Account</span>
                            <span className="text-sm font-semibold text-[#0F172A] block mt-1.5 truncate" title={client.payoutDetails}>{client.payoutDetails || '—'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText size={14} className="text-[#94A3B8]" />
                            Internal Notes
                        </h3>
                        <p className="text-[13px] text-[#64748B] italic leading-relaxed">
                            {client.notes ? `"${client.notes}"` : 'No administrative notes recorded.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Statement Center (Multi-Tab Ledger) ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                {/* Tabs Selector */}
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 flex items-center gap-6 overflow-x-auto">
                    {[
                        { id: 'properties', label: 'Linked Properties', count: client.properties?.length || 0 },
                        { id: 'collections', label: 'Rent Collections', count: client.payments?.length || 0 },
                        { id: 'expenses', label: 'Expenses Incurred', count: client.expenses?.length || 0 },
                        { id: 'payouts', label: 'Payout Ledger', count: client.payouts?.length || 0 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                                activeTab === tab.id
                                ? 'border-[#0F172A] text-[#0F172A]'
                                : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
                            }`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                activeTab === tab.id ? 'bg-[#0f172a] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-6">
                    {/* tab 1: properties */}
                    {activeTab === 'properties' && (
                        <div>
                            {(!client.properties || client.properties.length === 0) ? (
                                <div className="py-12 text-center text-xs text-[#94A3B8]">
                                    No active properties are assigned to this landlord client profile yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {client.properties.map(p => (
                                        <div key={p.id} className="p-4 border border-[#E2E8F0] rounded-xl hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <Building2 size={16} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-bold text-[#0F172A] truncate">{p.name}</h4>
                                                    <span className="text-[10px] text-[#64748B] font-medium block mt-0.5">{p.unitsCount} Units registered</span>
                                                </div>
                                            </div>
                                            <div className="border-t border-[#F1F5F9] mt-4 pt-3 flex justify-between items-center text-xs">
                                                <span className="text-[#64748B]">Agency Commission</span>
                                                <span className="font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded-md">{p.agencyCommission}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* tab 2: collections */}
                    {activeTab === 'collections' && (
                        <div className="overflow-x-auto">
                            {(!client.payments || client.payments.length === 0) ? (
                                <div className="py-12 text-center text-xs text-[#94A3B8]">
                                    No rent payments have been captured for this landlord's properties yet.
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                            <th className="px-4 py-2.5">Date Collected</th>
                                            <th className="px-4 py-2.5">Property</th>
                                            <th className="px-4 py-2.5">Tenant Details</th>
                                            <th className="px-4 py-2.5">Type</th>
                                            <th className="px-4 py-2.5 text-right">Amount Collected</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {client.payments.map((pay, idx) => (
                                            <tr key={pay.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(pay.createdAt)}</td>
                                                <td className="px-4 py-3 font-semibold text-[#475569]">{pay.propertyName}</td>
                                                <td className="px-4 py-3 text-[#64748B]">
                                                    <span className="font-semibold text-[#0f172a]">{pay.tenantName}</span> (Unit {pay.unitName || '—'})
                                                </td>
                                                <td className="px-4 py-3 uppercase text-[9px] font-bold text-[#64748B]">
                                                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded">{pay.type}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(pay.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* tab 3: expenses */}
                    {activeTab === 'expenses' && (
                        <div className="overflow-x-auto">
                            {(!client.expenses || client.expenses.length === 0) ? (
                                <div className="py-12 text-center text-xs text-[#94A3B8]">
                                    No property operating expenses or repairs have been logged for this landlord yet.
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                            <th className="px-4 py-2.5">Date Incurred</th>
                                            <th className="px-4 py-2.5">Property</th>
                                            <th className="px-4 py-2.5">Category</th>
                                            <th className="px-4 py-2.5">Expense Name</th>
                                            <th className="px-4 py-2.5">Description</th>
                                            <th className="px-4 py-2.5 text-right">Amount Deducted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {client.expenses.map((exp, idx) => (
                                            <tr key={exp.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(exp.date)}</td>
                                                <td className="px-4 py-3 font-semibold text-[#475569]">{exp.propertyName}</td>
                                                <td className="px-4 py-3 uppercase text-[9px] font-bold text-red-600">
                                                    <span className="px-1.5 py-0.5 bg-red-50 rounded">{exp.category}</span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-[#0F172A]">{exp.feeName}</td>
                                                <td className="px-4 py-3 text-[#64748B] max-w-xs truncate" title={exp.description}>{exp.description || '—'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* tab 4: payouts */}
                    {activeTab === 'payouts' && (
                        <div className="overflow-x-auto">
                            {(!client.payouts || client.payouts.length === 0) ? (
                                <div className="py-12 text-center text-xs text-[#94A3B8]">
                                    No disbursed payouts have been logged for this landlord client yet.
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                            <th className="px-4 py-2.5">Date Paid</th>
                                            <th className="px-4 py-2.5">Reference Number</th>
                                            <th className="px-4 py-2.5">Method</th>
                                            <th className="px-4 py-2.5">Payout Month</th>
                                            <th className="px-4 py-2.5">Administrative Notes</th>
                                            <th className="px-4 py-2.5 text-right">Disbursed Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {client.payouts.map((p, idx) => (
                                            <tr key={p.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(p.createdAt)}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-[#475569] uppercase">{p.referenceNumber || '—'}</td>
                                                <td className="px-4 py-3 uppercase text-[9px] font-bold text-[#64748B]">
                                                    <span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded">{p.paymentMethod}</span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-[#0F172A]">{p.payoutMonth || '—'}</td>
                                                <td className="px-4 py-3 text-[#64748B] max-w-xs truncate" title={p.notes}>{p.notes || '—'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── DISBURSAL MODAL ── */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                        {/* Header */}
                        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Record Landlord Payout</h3>
                                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-medium mt-0.5">Disburse net balance and trigger email receipt</p>
                            </div>
                            <button 
                                onClick={() => setShowPayoutModal(false)}
                                className="h-7 w-7 rounded bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handlePayoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-600">
                                    {modalError}
                                </div>
                            )}

                            {modalSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-semibold text-emerald-700">
                                    {modalSuccess}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Max Outstanding Net Due</label>
                                <div className="p-3 bg-amber-50/50 border border-amber-100 text-amber-700 font-bold text-sm rounded-lg">
                                    {formatCurrency(client.outstandingPayout)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Disbursed Amount (KES)</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        required
                                        placeholder="Enter amount..."
                                        value={payoutForm.amount}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold outline-none focus:border-[#0F172A] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Payout Month</label>
                                    <input 
                                        type="month" 
                                        required
                                        value={payoutForm.payoutMonth}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutMonth: e.target.value }))}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold outline-none focus:border-[#0F172A] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Disbursal Method</label>
                                    <select
                                        value={payoutForm.paymentMethod}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold outline-none focus:border-[#0F172A] transition-colors"
                                    >
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash / Cheque</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Reference Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. QTX7619208..."
                                        value={payoutForm.referenceNumber}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold outline-none focus:border-[#0F172A] transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Administrative Notes / Memo</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add payout description or bank info..."
                                    value={payoutForm.notes}
                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold outline-none focus:border-[#0F172A] transition-colors resize-none"
                                />
                            </div>

                            {/* Footer */}
                            <div className="border-t border-[#E2E8F0] pt-4 flex justify-end gap-3 shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setShowPayoutModal(false)}
                                    className="h-9 px-4 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submittingPayout}
                                    className="h-9 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    {submittingPayout ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                                    Confirm Disbursal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
