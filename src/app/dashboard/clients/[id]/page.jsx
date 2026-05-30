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
    Settings,
    FileText,
    Percent,
    CheckCircle2
} from 'lucide-react';
import { 
    fetchAPI, 
    formatCurrency, 
    formatDate, 
    getCurrentMonth 
} from '@/lib/api';
import { PageHeader, LoadingPage, Badge } from '@/components/ui';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const getB2BCharge = (amount) => {
    if (amount <= 49) return 2;
    if (amount <= 100) return 3;
    if (amount <= 500) return 8;
    if (amount <= 1000) return 13;
    if (amount <= 1500) return 18;
    if (amount <= 2500) return 25;
    if (amount <= 3500) return 30;
    if (amount <= 5000) return 39;
    if (amount <= 7500) return 48;
    if (amount <= 10000) return 54;
    if (amount <= 15000) return 63;
    if (amount <= 20000) return 68;
    if (amount <= 25000) return 74;
    if (amount <= 30000) return 79;
    if (amount <= 35000) return 90;
    if (amount <= 40000) return 106;
    if (amount <= 45000) return 110;
    return 115;
};

export default function LandlordDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submittingPayout, setSubmittingPayout] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showGatewayModal, setShowGatewayModal] = useState(false);
    const [activeTab, setActiveTab] = useState('properties');
    
    // REALTIME FIRESTORE BALANCES & SETTINGS
    const [integrationTier, setIntegrationTier] = useState('tier1');
    const [mpesaBalances, setMpesaBalances] = useState({
        utility: 0,
        working: 0,
        isLive: false,
        lastSynced: null
    });
    
    // Gateway Update State
    const [gatewayForm, setGatewayForm] = useState({
        payoutMethod: 'mpesa_b2c',
        payoutDetails: '',
        accountName: ''
    });
    const [updatingGateway, setUpdatingGateway] = useState(false);

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
                    amount: res.data.outstandingPayout > 0 ? res.data.outstandingPayout.toString() : '',
                    paymentMethod: res.data.payoutMethod && res.data.payoutMethod.startsWith('mpesa') ? 'mpesa' : (res.data.payoutMethod || 'mpesa')
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

    // Firestore listener for settings (tier & balances)
    useEffect(() => {
        const agencyId = 'fcZbLipBQxFHv9rCh1y1';
        const unsubscribe = onSnapshot(doc(db, 'settings', agencyId), (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            if (data) setIntegrationTier(data.integrationTier || 'tier1');
            if (data?.liveMpesaBalances) {
                setMpesaBalances({
                    utility: data.liveMpesaBalances.utility || 0,
                    working: data.liveMpesaBalances.working || 0,
                    isLive: data.liveMpesaBalances.isLive || false,
                    lastSynced: data.liveMpesaBalances.lastSynced || null
                });
            }
        });
        return () => unsubscribe();
    }, []);

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

    const handleGatewayUpdate = async (e) => {
        e.preventDefault();
        setUpdatingGateway(true);
        try {
            const res = await fetchAPI(`/clients/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    commissionRate: client.commissionRate,
                    notes: client.notes,
                    assignedProperties: client.properties?.map(p => p.id) || [],
                    payoutMethod: gatewayForm.payoutMethod,
                    payoutDetails: gatewayForm.payoutDetails,
                    accountName: gatewayForm.accountName
                })
            });
            if (res.success) {
                setShowGatewayModal(false);
                loadClientData(true);
            }
        } catch (err) {
            console.error('Failed to update gateway:', err);
        } finally {
            setUpdatingGateway(false);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0">
                        <Percent size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Commission Deducted</span>
                        <h3 className="text-lg font-bold tracking-tight text-[#007AFF] mt-0.5">{formatCurrency(client.totalCommission)}</h3>
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
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
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

            {/* ── Statement Center (Multi-Tab Ledger) ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                {/* Tabs Selector */}
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 flex items-center gap-6 overflow-x-auto">
                    {[
                        { id: 'properties', label: 'Linked Properties', count: client.properties?.length || 0 },
                        { id: 'collections', label: 'Rent Collections', count: client.payments?.length || 0 },
                        { id: 'commissions', label: 'Commissions Ledger', count: client.payments?.filter(p => p.commissionEarned > 0).length || 0 },
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
                                            <th className="px-4 py-2.5">Reference</th>
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
                                                <td className="px-4 py-3 font-mono font-bold text-[#475569] uppercase">{pay.referenceNumber || '—'}</td>
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

                    {/* tab 3.5: commissions */}
                    {activeTab === 'commissions' && (
                        <div className="overflow-x-auto">
                            {(!client.payments || client.payments.length === 0) ? (
                                <div className="py-12 text-center text-xs text-[#94A3B8]">
                                    No commissions have been earned for this landlord yet.
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                            <th className="px-4 py-2.5">Transaction Date</th>
                                            <th className="px-4 py-2.5">Property</th>
                                            <th className="px-4 py-2.5">Tenant Details</th>
                                            <th className="px-4 py-2.5 text-right">Gross Amount</th>
                                            <th className="px-4 py-2.5 text-right">Commission Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {client.payments.filter(pay => pay.commissionEarned > 0).map((pay, idx) => (
                                            <tr key={pay.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(pay.createdAt)}</td>
                                                <td className="px-4 py-3 font-semibold text-[#475569]">{pay.propertyName}</td>
                                                <td className="px-4 py-3 text-[#64748B]">
                                                    <span className="font-semibold text-[#0f172a]">{pay.tenantName}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-[#64748B]">{formatCurrency(pay.amount)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-[#007AFF]">+{formatCurrency(pay.commissionEarned)}</td>
                                            </tr>
                                        ))}
                                        {client.payments.filter(pay => pay.commissionEarned > 0).length > 0 && (
                                            <tr className="bg-[#F8FAFC]">
                                                <td colSpan="4" className="px-4 py-3 text-right font-bold text-[#0F172A]">Total Commissions:</td>
                                                <td className="px-4 py-3 text-right font-extrabold text-[#007AFF]">
                                                    {formatCurrency(
                                                        client.payments.filter(pay => pay.commissionEarned > 0).reduce((acc, pay) => acc + pay.commissionEarned, 0)
                                                    )}
                                                </td>
                                            </tr>
                                        )}
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
                                            <th className="px-4 py-2.5">Administrative Notes</th>
                                            <th className="px-4 py-2.5 text-right">Gross Disbursed</th>
                                            <th className="px-4 py-2.5 text-right text-red-500">B2B Charge</th>
                                            <th className="px-4 py-2.5 text-right">Net Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {client.payouts.map((p, idx) => {
                                            const b2bCharge = getB2BCharge(p.amount);
                                            const grossDisbursed = p.amount + b2bCharge;
                                            const netPaid = p.amount;
                                            return (
                                                <tr key={p.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                    <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(p.createdAt)}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-[#475569] uppercase">{p.referenceNumber || '—'}</td>
                                                    <td className="px-4 py-3 uppercase text-[9px] font-bold text-[#64748B]">
                                                        <span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded">{p.paymentMethod}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#64748B] max-w-xs truncate" title={p.notes}>{p.notes || '—'}</td>
                                                    <td className="px-4 py-3 text-right text-[#64748B]">{formatCurrency(grossDisbursed)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-red-500">-{formatCurrency(b2bCharge)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(netPaid)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-[#F8FAFC]">
                                            <td colSpan="4" className="px-4 py-3 text-right font-bold text-[#0F172A]">Total Payouts:</td>
                                            <td className="px-4 py-3 text-right font-bold text-[#64748B]">
                                                {formatCurrency(client.payouts.reduce((acc, p) => acc + p.amount + getB2BCharge(p.amount), 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-red-500">
                                                -{formatCurrency(client.payouts.reduce((acc, p) => acc + getB2BCharge(p.amount), 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                                                {formatCurrency(client.payouts.reduce((acc, p) => acc + p.amount, 0))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Remittance Details & Internal Notes ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={14} className="text-[#94A3B8]" />
                            Remittance & Payout Instructions
                        </h3>
                        <button 
                            onClick={() => {
                                setGatewayForm({
                                    payoutMethod: client.payoutMethod || 'mpesa_b2c',
                                    payoutDetails: client.payoutDetails || '',
                                    accountName: client.accountName || ''
                                });
                                setShowGatewayModal(true);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] hover:underline"
                        >
                            Update
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Preferred Method</span>
                            <span className="text-sm font-bold text-[#0F172A] uppercase block mt-1.5">
                                {client.payoutMethod === 'mpesa_b2c' ? 'M-Pesa Phone No.' : 
                                 client.payoutMethod === 'mpesa_b2b_till' ? 'M-Pesa Till No.' :
                                 client.payoutMethod === 'mpesa_b2b_paybill' ? 'M-Pesa Paybill' : client.payoutMethod || 'M-Pesa'}
                            </span>
                        </div>
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Remittance Account</span>
                            <span className="text-sm font-semibold text-[#0F172A] block mt-1.5 truncate" title={client.payoutDetails}>{client.payoutDetails || '—'}</span>
                        </div>
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Account Name (Beneficiary)</span>
                            <span className="text-sm font-semibold text-[#0F172A] block mt-1.5 truncate" title={client.accountName}>{client.accountName || '—'}</span>
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

            {/* ── DISBURSAL MODAL ── */}
            {showPayoutModal && (
                (() => {
                    const isLiveMpesa = (integrationTier === 'tier2' || mpesaBalances?.isLive) && payoutForm.paymentMethod === 'mpesa';
                    const mpesaType = client?.payoutMethod === 'mpesa_b2c' ? 'B2C (Phone)' :
                                      client?.payoutMethod === 'mpesa_b2b_till' ? 'B2B (Till)' :
                                      client?.payoutMethod === 'mpesa_b2b_paybill' ? 'B2B (Paybill)' : 'M-Pesa';

                    return (
                        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-zoom-in">
                                {/* Header */}
                                <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-[#0F172A]">
                                            {isLiveMpesa ? `Execute Live ${mpesaType} Payout` : 'Record Landlord Payment'}
                                        </h3>
                                        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">
                                            {isLiveMpesa ? `Perform actual ${mpesaType} transaction and record in ledger` : 'Record payment of net collected funds to landlord'}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowPayoutModal(false)} className="text-[#94A3B8] hover:text-[#0f172a] transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                        {/* Form */}
                        <form onSubmit={handlePayoutSubmit} className="p-5 space-y-3">
                            {modalError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">{modalError}</div>}
                            {modalSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> {modalSuccess}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Left Column: Financial Ledger Statement */}
                                <div className="space-y-3">
                                    {/* Compact Balance Card */}
                                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">Available Outstanding Payout</span>
                                            <span className="text-[9px] text-[#64748B] block mt-0.5">Disbursed to: {client.name}</span>
                                        </div>
                                        <h4 className="text-lg font-extrabold text-amber-600">{formatCurrency(client.outstandingPayout)}</h4>
                                    </div>

                                    {/* Compact Remittance Statement */}
                                    <div className="bg-[#F8FAFC]/55 border border-[#E2E8F0] rounded-lg px-4 py-2.5">
                                        <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-2 text-center">Remittance Calculation Statement</span>
                                        <div className="space-y-1.5 text-[11px] text-[#475569]">
                                            <div className="flex justify-between items-center">
                                                <span>Gross Rent Collected</span>
                                                <span className="font-semibold text-[#0F172A]">{formatCurrency(client.totalCollected || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-blue-600">
                                                <span>Agency Commission Deducted</span>
                                                <span className="font-semibold">- {formatCurrency(client.totalCommission || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-red-600">
                                                <span>Operating Expenses Incurred</span>
                                                <span className="font-semibold">- {formatCurrency(client.totalExpenses || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[#64748B] pb-1.5 border-b border-[#F1F5F9]">
                                                <span>Total Disbursed Already</span>
                                                <span className="font-semibold">- {formatCurrency(client.totalPaid || 0)}</span>
                                            </div>
                                            <div className="pt-1 flex justify-between items-center font-bold text-[#0F172A] text-xs">
                                                <span>Net Outstanding Payout</span>
                                                <span className="text-amber-600">{formatCurrency(client.outstandingPayout || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Input Actions */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Amount (KSh) *</label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                min="0.01"
                                                max={client.outstandingPayout}
                                                placeholder="Amount"
                                                value={payoutForm.amount}
                                                onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-2 text-xs outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Method *</label>
                                            <select
                                                value={payoutForm.paymentMethod}
                                                onChange={(e) => setPayoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-2 text-xs outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] uppercase font-semibold"
                                            >
                                                <option value="mpesa">M-Pesa</option>
                                                <option value="bank">Bank</option>
                                                <option value="cash">Cash</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Month *</label>
                                            <input
                                                type="month"
                                                required
                                                value={payoutForm.payoutMonth}
                                                onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutMonth: e.target.value }))}
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-2 text-xs outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                            />
                                        </div>
                                    </div>

                                    <div className={`grid grid-cols-1 ${!isLiveMpesa ? 'md:grid-cols-2' : ''} gap-3`}>
                                        {!isLiveMpesa && (
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Reference Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="MPesa / Bank ID"
                                                    value={payoutForm.referenceNumber}
                                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-2 text-xs outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] font-mono font-bold uppercase"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Beneficiary Name</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={client.accountName || ''}
                                                placeholder="Not Set"
                                                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-md h-9 px-2 text-[11px] outline-none text-[#64748B] font-semibold truncate"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-[#F1F5F9] mt-2">
                                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">Notification Options</label>
                                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Email Receipt */}
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="chk-email-payout-opt"
                                                    checked={payoutForm.sendEmail !== false}
                                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                                                    className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF] mt-0.5 cursor-pointer"
                                                />
                                                <label htmlFor="chk-email-payout-opt" className="text-[10px] font-medium text-[#475569] leading-snug cursor-pointer select-none truncate" title={client.email}>
                                                    Email to<br/><span className="text-[#94A3B8] font-normal truncate max-w-[120px] block">{client.email || 'None'}</span>
                                                </label>
                                            </div>

                                            {/* SMS Receipt */}
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="chk-sms-payout-opt"
                                                    checked={payoutForm.sendSms !== false}
                                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, sendSms: e.target.checked }))}
                                                    className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF] mt-0.5 cursor-pointer"
                                                />
                                                <label htmlFor="chk-sms-payout-opt" className="text-[10px] font-medium text-[#475569] leading-snug cursor-pointer select-none truncate" title={client.phone}>
                                                    SMS to<br/><span className="text-[#94A3B8] font-normal truncate max-w-[120px] block">{client.phone || 'None'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Transaction Notes</label>
                                        <textarea
                                            placeholder="Include payment notes for client receipt..."
                                            value={payoutForm.notes}
                                            onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md py-1.5 px-2 text-xs outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] h-[52px] resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    onClick={() => setShowPayoutModal(false)}
                                    className="h-9 px-4 rounded-md border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-[12px] font-semibold text-[#64748B]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPayout}
                                    className={`h-9 px-4 rounded-md text-white font-semibold text-[12px] transition-colors flex items-center gap-1.5 ${isLiveMpesa ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                                >
                                    {submittingPayout ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                                    <span>{isLiveMpesa ? `Execute ${mpesaType} Payout` : 'Record Payment'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                    );
                })()
            )}

            {/* ── UPDATE GATEWAY MODAL ── */}
            {showGatewayModal && (
                <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-zoom-in">
                        <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                            <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">Update Remittance Gateway</h3>
                            <button onClick={() => setShowGatewayModal(false)} className="text-[#94A3B8] hover:text-[#0f172a]">
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleGatewayUpdate} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gateway Method</label>
                                <select
                                    value={gatewayForm.payoutMethod}
                                    onChange={(e) => setGatewayForm(prev => ({ ...prev, payoutMethod: e.target.value, payoutDetails: '' }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] text-[#0F172A]"
                                >
                                    <option value="mpesa_b2c">M-Pesa Phone Number (B2C)</option>
                                    <option value="mpesa_b2b_till">M-Pesa Till Number (B2B)</option>
                                    <option value="mpesa_b2b_paybill">M-Pesa Paybill (B2B)</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gateway Number / Account Details</label>
                                <input
                                    type="text"
                                    required
                                    value={gatewayForm.payoutDetails}
                                    onChange={(e) => setGatewayForm(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                    placeholder="Enter details..."
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] text-[#0F172A]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Account Name (Beneficiary)</label>
                                <input
                                    type="text"
                                    value={gatewayForm.accountName}
                                    onChange={(e) => setGatewayForm(prev => ({ ...prev, accountName: e.target.value }))}
                                    placeholder="e.g. John Doe / Limited Co."
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] text-[#0F172A]"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                                <button type="button" onClick={() => setShowGatewayModal(false)} className="h-8 px-4 rounded-md border border-[#E2E8F0] hover:bg-slate-50 text-[12px] font-semibold text-[#64748B]">Cancel</button>
                                <button type="submit" disabled={updatingGateway} className="h-8 px-4 rounded-md bg-[#007AFF] hover:bg-blue-600 text-white font-semibold text-[12px] flex items-center gap-1.5">
                                    {updatingGateway ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                    Update Gateway
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
