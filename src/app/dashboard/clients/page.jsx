'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
    fetchAPI,
    getProperties,
    formatCurrency,
    formatDate,
    getCurrentMonth
} from '@/lib/api';

import { useAuth } from '@/lib/AuthContext';
import { LoadingPage } from '@/components/ui';

import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import {
    Users,
    UserCheck,
    Plus,
    Search,
    TrendingUp,
    CreditCard,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Mail,
    Phone,
    Percent,
    FileText,
    Settings,
    Trash2,
    X,
    Building2,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    Briefcase,
    Loader2,
    PieChart,
    Receipt,
    RefreshCw,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle
} from 'lucide-react';

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

export default function ClientManagementPage() {
    const router = useRouter();
    const { isAdmin, user } = useAuth();

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncingBalances, setSyncingBalances] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [integrationTier, setIntegrationTier] = useState('tier1');
    const [activeMainTab, setActiveMainTab] = useState('landlords');

    // Aggregate financial data (across all landlords)
    const [allPayments, setAllPayments] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [allPayouts, setAllPayouts] = useState([]);

    // REALTIME FIRESTORE BALANCES
    const [mpesaBalances, setMpesaBalances] = useState({
        utility: 0,
        working: 0,
        isLive: false,
        lastSynced: null
    });

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    const [selectedClient, setSelectedClient] = useState(null);

    // Create/Edit Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        commissionRate: 10,
        payoutMethod: 'mpesa_b2c',
        payoutDetails: '',
        accountName: '',
        notes: '',
        assignedProperties: []
    });

    // Payout Form
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        payoutMonth: getCurrentMonth(),
        notes: '',
        deductExpenses: true
    });

    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submittingPayout, setSubmittingPayout] = useState(false);

    // ─────────────────────────────────────────────
    // REALTIME FIRESTORE LISTENER
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!user || !user.agencyId) return;
        const agencyId = user.agencyId;

        const unsubscribe = onSnapshot(
            doc(db, 'settings', agencyId),
            (snapshot) => {
                if (!snapshot.exists()) return;

                const data = snapshot.data();

                if (data) {
                    setIntegrationTier(data.integrationTier || 'tier1');
                }

                if (data?.liveMpesaBalances) {
                    setMpesaBalances({
                        utility: data.liveMpesaBalances.utility || 0,
                        working: data.liveMpesaBalances.working || 0,
                        isLive: data.liveMpesaBalances.isLive || false,
                        lastSynced: data.liveMpesaBalances.lastSynced || null
                    });
                }
            },
            (error) => {
                console.error('Failed to fetch live balances:', error);
            }
        );

        return () => unsubscribe();
    }, [user?.agencyId]);

    // ─────────────────────────────────────────────
    // LOAD CLIENTS & PROPERTIES
    // ─────────────────────────────────────────────
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const [clientsRes, propsRes] = await Promise.all([
                fetchAPI('/clients'),
                getProperties()
            ]);

            const clientsList = clientsRes.data || [];
            setClients(clientsList);
            setProperties(propsRes.data || propsRes || []);

            // Aggregate all financial records across all landlords
            const payments = clientsList.flatMap(c => (c.payments || []).map(p => ({ ...p, landlordName: c.name, landlordId: c.id })));
            const expenses = clientsList.flatMap(c => (c.expenses || []).map(e => ({ ...e, landlordName: c.name, landlordId: c.id })));
            const payouts = clientsList.flatMap(c => (c.payouts || []).map(p => ({ ...p, landlordName: c.name, landlordId: c.id })));

            payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            payouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setAllPayments(payments);
            setAllExpenses(expenses);
            setAllPayouts(payouts);
        } catch (err) {
            console.error('Failed to load clients and properties:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    const togglePropertySelection = (propId) => {
        setFormData((prev) => {
            const exists = prev.assignedProperties.includes(propId);

            return {
                ...prev,
                assignedProperties: exists
                    ? prev.assignedProperties.filter((id) => id !== propId)
                    : [...prev.assignedProperties, propId]
            };
        });
    };

    const handleEditClientClick = (client) => {
        setSelectedClient(client);

        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            commissionRate: client.commissionRate || 10,
            payoutMethod: client.payoutMethod || 'mpesa_b2c',
            payoutDetails: client.payoutDetails || '',
            accountName: client.accountName || '',
            notes: client.notes || '',
            assignedProperties: (client.properties || []).map((p) => p.id)
        });

        setFormError('');
        setFormSuccess('');

        setShowEditModal(true);
    };
    const handleUpdateClient = async (e) => {
        e.preventDefault();

        setFormError('');
        setFormSuccess('');

        if (!formData.name) {
            setFormError('Client name is required');
            return;
        }

        try {
            const result = await fetchAPI(`/clients/${selectedClient.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (result.success) {
                setFormSuccess('Client profile updated successfully!');

                setTimeout(() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                    setFormSuccess('');

                    loadData(true);
                }, 1500);
            }
        } catch (err) {
            setFormError(err.message || 'Failed to update client');
        }
    };
    const handleRecordPayout = async (e) => {
        e.preventDefault();

        setFormError('');
        setFormSuccess('');
        setSubmittingPayout(true);

        const amountNum = parseFloat(payoutForm.amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            setFormError(
                'A valid payout amount greater than KSh 0 is required'
            );

            setSubmittingPayout(false);
            return;
        }

        try {
            const result = await fetchAPI(
                `/clients/${selectedClient.id}/payouts`,
                {
                    method: 'POST',
                    body: JSON.stringify(payoutForm)
                }
            );

            if (result.success) {
                setFormSuccess(
                    `Payment of ${formatCurrency(
                        amountNum
                    )} recorded and client receipt emailed!`
                );

                setTimeout(() => {
                    setShowPayoutModal(false);
                    setSelectedClient(null);
                    setFormSuccess('');

                    loadData(true);
                }, 2000);
            }
        } catch (err) {
            setFormError(err.message || 'Failed to record payment');
        } finally {
            setSubmittingPayout(false);
        }
    };
    const dynamicNetOutstanding = selectedClient
        ? Math.round(
            (selectedClient.totalCollected || 0) -
            (selectedClient.totalCommission || 0) -
            (payoutForm.deductExpenses
                ? selectedClient.totalExpenses || 0
                : 0) -
            (selectedClient.totalPaid || 0)
        )
        : 0;
    const handleCreateClient = async (e) => {
        e.preventDefault();

        setFormError('');
        setFormSuccess('');

        if (!formData.name) {
            setFormError('Client name is required');
            return;
        }

        try {
            const result = await fetchAPI('/clients', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (result.success) {
                if (formData.assignedProperties.length > 0) {
                    await fetchAPI(`/clients/${result.data.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            ...formData,
                            assignedProperties: formData.assignedProperties
                        })
                    });
                }

                setFormSuccess('Client profile created successfully!');

                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    commissionRate: 10,
                    payoutMethod: 'mpesa_b2c',
                    payoutDetails: '',
                    accountName: '',
                    notes: '',
                    assignedProperties: []
                });

                setTimeout(() => {
                    setShowCreateModal(false);
                    setFormSuccess('');
                    loadData(true);
                }, 1500);
            }
        } catch (err) {
            setFormError(err.message || 'Failed to create client');
        }
    };

    const handleSyncBalances = async () => {
        setSyncingBalances(true);

        try {
            const settingsRes = await fetchAPI('/settings');
            const settingsData = settingsRes?.data || settingsRes || {};
            const isTierIntegrated = ['dedicated_mpesa', 'kodipay_paybill', 'tier2', 'tier3'].includes(settingsData.integrationTier);

            if (!isTierIntegrated) {
                setSyncingBalances(false);
                return;
            }

            const res = await fetchAPI('/settings/sync-mpesa-balances', {
                method: 'POST'
            });

            if (!res.success) {
                console.error('Failed to sync balances');
            }

            // No polling needed anymore.
            // Firestore listener auto-updates UI.
        } catch (err) {
            console.error('Failed to sync balances:', err);
        } finally {
            setSyncingBalances(false);
        }
    };

    useEffect(() => {
        loadData();

        handleSyncBalances()


    }, [loadData]);

    // ─────────────────────────────────────────────
    // CLIENT ACTIONS
    // ─────────────────────────────────────────────
    const handleDeleteClient = async (clientId) => {
        if (
            !confirm(
                'Are you sure you want to permanently delete this client profile?'
            )
        ) {
            return;
        }

        try {
            const result = await fetchAPI(`/clients/${clientId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                loadData(true);
            }
        } catch (err) {
            alert(err.message || 'Failed to delete client');
        }
    };

    const handlePayoutClick = (client) => {
        setSelectedClient(client);

        const initialNetWithoutExpenses = Math.round((client.totalCollected || 0) - (client.totalCommission || 0) - (client.totalPaid || 0));

        setPayoutForm({
            amount: initialNetWithoutExpenses > 0 ? String(initialNetWithoutExpenses) : '',
            paymentMethod: client.payoutMethod && client.payoutMethod.startsWith('mpesa') ? 'mpesa' : (client.payoutMethod || 'mpesa'),
            referenceNumber: '',
            payoutMonth: getCurrentMonth(),
            notes: '',
            deductExpenses: false
        });

        setShowPayoutModal(true);
    };

    // ─────────────────────────────────────────────
    // FILTERS
    // ─────────────────────────────────────────────
    const filteredClients = clients.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.includes(searchQuery)
    );

    // ─────────────────────────────────────────────
    // DASHBOARD METRICS
    // ─────────────────────────────────────────────
    const totalCollected = clients.reduce(
        (acc, c) => acc + (c.totalCollected || 0),
        0
    );

    const totalCommission = clients.reduce(
        (acc, c) => acc + (c.totalCommission || 0),
        0
    );

    const totalExpenses = clients.reduce(
        (acc, c) => acc + (c.totalExpenses || 0),
        0
    );

    const totalPaid = clients.reduce(
        (acc, c) => acc + (c.totalPaid || 0),
        0
    );

    const totalOutstanding = clients.reduce(
        (acc, c) => acc + (c.outstandingPayout || 0),
        0
    );

    if (loading) return <LoadingPage />;

    // Block subagents from accessing this page
    if (!isAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <UserCheck size={24} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Access Restricted</h2>
                <p className="text-xs text-[#64748B] max-w-xs">Only agency administrators can access the Client Remittance module. Please contact your admin.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full bg-[#FAFAFA] min-h-screen p-4 md:p-6 overflow-y-auto">

            {/* ───────────────────────────────────── */}
            {/* HEADER */}
            {/* ───────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-16 md:pt-0">
                <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
                        Landlord Remitance & Management
                    </h2>

                    <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-widest">
                        Manage Landlord Profiles & Payouts
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="https://org.ke.m-pesa.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-4 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-md text-[13px] font-semibold hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                    >
                        <ArrowUpRight size={14} />
                        M-Pesa Portal
                    </a>


                </div>
            </div>

            {/* ───────────────────────────────────── */}
            {/* LIVE M-PESA BALANCES */}
            {/* ───────────────────────────────────── */}
            {['dedicated_mpesa', 'kodipay_paybill', 'tier2', 'tier3'].includes(integrationTier) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Utility Account */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 relative overflow-hidden">

                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                        Utility Account Balance
                                    </span>

                                    {mpesaBalances?.isLive && (
                                        <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                            Live
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-3xl font-bold tracking-tight text-[#0F172A]">
                                    {formatCurrency(mpesaBalances?.utility || 0)}
                                </h3>

                                {mpesaBalances?.lastSynced && (
                                    <p className="text-[10px] text-[#94A3B8] mt-2">
                                        Last synced:{' '}
                                        {formatDate(mpesaBalances.lastSynced)}
                                    </p>
                                )}
                            </div>

                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ArrowDownCircle size={26} />
                            </div>
                        </div>
                    </div>

                    {/* Working Account */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 relative overflow-hidden">

                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                        Working Account Balance
                                    </span>

                                </div>

                                <h3 className="text-3xl font-bold tracking-tight text-[#0F172A]">
                                    {formatCurrency(mpesaBalances?.working || 0)}
                                </h3>

                                {!mpesaBalances?.isLive && (
                                    <p className="text-[10px] text-amber-600 mt-2">
                                        Simulated balance mode enabled
                                    </p>
                                )}
                            </div>

                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Wallet size={26} />
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* ── Key Metrics Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Total Rent Collected</span>
                        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(totalCollected)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Commission Earned</span>
                        <h3 className="text-lg font-semibold tracking-tight text-[#007AFF] mt-0.5">{formatCurrency(totalCommission)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Operating Expenses</span>
                        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(totalExpenses)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Total Paid to Landlords</span>
                        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(totalPaid)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Total Outstanding Payouts</span>
                        <h3 className={`text-lg font-semibold tracking-tight mt-0.5 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-[#0F172A]'}`}>{formatCurrency(totalOutstanding)}</h3>
                    </div>
                </div>
            </div>

            {/* ── Main Tabs ── */}
            <div className="mt-6 border-b border-[#E2E8F0] flex items-center gap-0 overflow-x-auto">
                {[
                    { id: 'landlords', label: 'Landlords', icon: Users, count: clients.length },
                    { id: 'collections', label: 'Rent Collections', icon: TrendingUp, count: allPayments.length },
                    { id: 'commissions', label: 'Commissions Ledger', icon: PieChart, count: allPayments.filter(p => p.commissionEarned > 0).length },
                    { id: 'expenses', label: 'Expenses Incurred', icon: Receipt, count: allExpenses.length },
                    { id: 'payouts', label: 'Payout Ledger', icon: CreditCard, count: allPayouts.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveMainTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeMainTab === tab.id
                                ? 'border-[#0F172A] text-[#0F172A]'
                                : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
                            }`}
                    >
                        <tab.icon size={12} />
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeMainTab === tab.id ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab 1: Landlord Cards ── */}
            {activeMainTab === 'landlords' && (<>
                {/* Filter Bar */}
                <div className="flex items-center gap-3 bg-white border border-[#0F172A] mt-5 rounded-lg px-3 py-2 max-w-md">
                    <Search size={16} className="text-[#94A3B8]" />
                    <input
                        type="text"
                        placeholder="Search by client name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[#0F172A] placeholder-[#94A3B8]"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-[#94A3B8] hover:text-[#0F172A]">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* ── Landlord Cards Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-10">
                    {filteredClients.length === 0 ? (
                        <div className="col-span-full bg-white border border-[#E2E8F0] rounded-xl py-16 text-center shadow-sm">
                            <Briefcase size={36} className="text-[#94A3B8] mx-auto mb-3" />
                            <h3 className="text-[14px] font-semibold text-[#0F172A]">
                                No landlord profiles found
                            </h3>
                            <p className="text-xs text-[#94A3B8] mt-1">
                                Landlord profiles are automatically created and updated when you
                                register or edit properties!
                            </p>
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.id}
                                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#007AFF]/30 transition-all duration-200 cursor-pointer group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center text-sm font-bold shrink-0">
                                            {client.name.charAt(0)}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-semibold text-[#0F172A] truncate">
                                                {client.name}
                                            </h3>

                                            <div className="mt-1 flex flex-col gap-1 text-[11px] text-[#64748B]">
                                                {client.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={11} />
                                                        {client.phone}
                                                    </span>
                                                )}

                                                {client.email && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        <Mail size={11} />
                                                        {client.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Properties Badge */}
                                    <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[11px] font-medium shrink-0">
                                        <Building2 size={11} />
                                        {client.propertiesCount}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="my-4 border-t border-[#F1F5F9]" />

                                {/* Stats */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#64748B]">
                                            Collected (Gross)
                                        </span>
                                        <span className="text-[13px] font-semibold text-[#0F172A]">
                                            {formatCurrency(client.totalCollected)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#64748B]">
                                            Commission
                                        </span>
                                        <span className="text-[13px] font-semibold text-blue-600">
                                            {formatCurrency(client.totalCommission || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#64748B]">
                                            Expenses
                                        </span>
                                        <span className="text-[13px] font-semibold text-red-600">
                                            {formatCurrency(client.totalExpenses || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#64748B]">
                                            Outstanding
                                        </span>

                                        <span
                                            className={`text-[13px] font-bold ${client.outstandingPayout > 0
                                                ? "text-amber-600"
                                                : "text-slate-400"
                                                }`}
                                        >
                                            {formatCurrency(client.outstandingPayout)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-[#64748B]">
                                            Total Paid
                                        </span>

                                        <span className="text-[13px] font-bold text-emerald-600">
                                            {formatCurrency(client.totalPaid)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-5">
                                    <button
                                        disabled={client.outstandingPayout <= 0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePayoutClick(client);
                                        }}
                                        className={`flex-1 h-9 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1 transition-all ${client.outstandingPayout > 0
                                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                                            : "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed"
                                            }`}
                                    >
                                        <ArrowUpRight size={13} />
                                        Pay Landlord
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClient(client.id);
                                        }}
                                        className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                                        title="Delete profile"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </>) /* end Tab 1: Landlords */}

            {/* ── Tab 2: Rent Collections ── */}
            {activeMainTab === 'collections' && (
                <div className="mt-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">All Rent Collections — {allPayments.length} records</span>
                        <span className="text-[11px] font-bold text-emerald-600">{formatCurrency(allPayments.reduce((s, p) => s + (p.amount || 0), 0))}</span>
                    </div>
                    {allPayments.length === 0 ? (
                        <div className="py-16 text-center text-xs text-[#94A3B8]">No rent payments captured yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                        <th className="px-4 py-2.5">Date</th>
                                        <th className="px-4 py-2.5">Landlord</th>
                                        <th className="px-4 py-2.5">Property</th>
                                        <th className="px-4 py-2.5">Tenant Details</th>
                                        <th className="px-4 py-2.5">Reference</th>
                                        <th className="px-4 py-2.5">Type</th>
                                        <th className="px-4 py-2.5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {allPayments.map((pay, idx) => (
                                        <tr key={pay.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                            <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(pay.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <Link href={`/dashboard/clients/${pay.landlordId}`} className="font-bold text-[#007AFF] hover:underline">{pay.landlordName}</Link>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#475569]">{pay.propertyName}</td>
                                            <td className="px-4 py-3 text-[#64748B]"><span className="font-semibold text-[#0f172a]">{pay.tenantName}</span> (Unit {pay.unitName || '—'})</td>
                                            <td className="px-4 py-3 font-mono font-bold text-[#475569] uppercase">{pay.referenceNumber || '—'}</td>
                                            <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded uppercase text-[9px] font-bold text-[#64748B]">{pay.type}</span></td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(pay.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab 3: Commissions Ledger ── */}
            {activeMainTab === 'commissions' && (
                <div className="mt-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Commissions Ledger — {allPayments.filter(p => p.commissionEarned > 0).length} records</span>
                        <span className="text-[11px] font-bold text-[#007AFF]">{formatCurrency(totalCommission)}</span>
                    </div>
                    {allPayments.filter(p => p.commissionEarned > 0).length === 0 ? (
                        <div className="py-16 text-center text-xs text-[#94A3B8]">No commissions earned yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                        <th className="px-4 py-2.5">Date</th>
                                        <th className="px-4 py-2.5">Landlord</th>
                                        <th className="px-4 py-2.5">Property</th>
                                        <th className="px-4 py-2.5">Tenant</th>
                                        <th className="px-4 py-2.5 text-right">Gross Amount</th>
                                        <th className="px-4 py-2.5 text-right">Commission Earned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {allPayments.filter(p => p.commissionEarned > 0).map((pay, idx) => (
                                        <tr key={pay.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                            <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(pay.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <Link href={`/dashboard/clients/${pay.landlordId}`} className="font-bold text-[#007AFF] hover:underline">{pay.landlordName}</Link>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#475569]">{pay.propertyName}</td>
                                            <td className="px-4 py-3 font-semibold text-[#0f172a]">{pay.tenantName}</td>
                                            <td className="px-4 py-3 text-right text-[#64748B]">{formatCurrency(pay.amount)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-[#007AFF]">+{formatCurrency(pay.commissionEarned)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-[#F8FAFC]">
                                        <td colSpan="5" className="px-4 py-3 text-right font-bold text-[#0F172A]">Total Commissions:</td>
                                        <td className="px-4 py-3 text-right font-extrabold text-[#007AFF]">{formatCurrency(totalCommission)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab 4: Expenses Incurred ── */}
            {activeMainTab === 'expenses' && (
                <div className="mt-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Expenses Incurred — {allExpenses.length} records</span>
                        <span className="text-[11px] font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                    </div>
                    {allExpenses.length === 0 ? (
                        <div className="py-16 text-center text-xs text-[#94A3B8]">No expenses logged yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                        <th className="px-4 py-2.5">Date</th>
                                        <th className="px-4 py-2.5">Landlord</th>
                                        <th className="px-4 py-2.5">Property</th>
                                        <th className="px-4 py-2.5">Category</th>
                                        <th className="px-4 py-2.5">Expense Name</th>
                                        <th className="px-4 py-2.5">Description</th>
                                        <th className="px-4 py-2.5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {allExpenses.map((exp, idx) => (
                                        <tr key={exp.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                            <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(exp.date)}</td>
                                            <td className="px-4 py-3">
                                                <Link href={`/dashboard/clients/${exp.landlordId}`} className="font-bold text-[#007AFF] hover:underline">{exp.landlordName}</Link>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#475569]">{exp.propertyName}</td>
                                            <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-red-50 rounded uppercase text-[9px] font-bold text-red-600">{exp.category}</span></td>
                                            <td className="px-4 py-3 font-semibold text-[#0F172A]">{exp.feeName}</td>
                                            <td className="px-4 py-3 text-[#64748B] max-w-xs truncate" title={exp.description}>{exp.description || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab 5: Payout Ledger ── */}
            {activeMainTab === 'payouts' && (
                <div className="mt-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Payout Ledger — {allPayouts.length} records</span>
                        <span className="text-[11px] font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                    </div>
                    {allPayouts.length === 0 ? (
                        <div className="py-16 text-center text-xs text-[#94A3B8]">No payouts disbursed yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                                        <th className="px-4 py-2.5">Date Paid</th>
                                        <th className="px-4 py-2.5">Landlord</th>
                                        <th className="px-4 py-2.5">Reference</th>
                                        <th className="px-4 py-2.5">Method</th>
                                        <th className="px-4 py-2.5">Notes</th>
                                        <th className="px-4 py-2.5 text-right">Gross Disbursed</th>
                                        <th className="px-4 py-2.5 text-right text-red-500">B2B Charge</th>
                                        <th className="px-4 py-2.5 text-right">Net Paid (Landlord)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {allPayouts.map((p, idx) => {
                                        const b2bCharge = getB2BCharge(p.amount);
                                        const grossDisbursed = p.amount + b2bCharge;
                                        const netPaid = p.amount;
                                        return (
                                            <tr key={p.id || idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                                <td className="px-4 py-3 text-[#0F172A] font-medium">{formatDate(p.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <Link href={`/dashboard/clients/${p.landlordId}`} className="font-bold text-[#007AFF] hover:underline">{p.landlordName}</Link>
                                                </td>
                                                <td className="px-4 py-3 font-mono font-bold text-[#475569] uppercase">{p.referenceNumber || '—'}</td>
                                                <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded uppercase text-[9px] font-bold text-[#64748B]">{p.paymentMethod}</span></td>
                                                <td className="px-4 py-3 text-[#64748B] max-w-xs truncate" title={p.notes}>{p.notes || '—'}</td>
                                                <td className="px-4 py-3 text-right text-[#64748B]">{formatCurrency(grossDisbursed)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">-{formatCurrency(b2bCharge)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(netPaid)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-[#F8FAFC]">
                                        <td colSpan="5" className="px-4 py-3 text-right font-bold text-[#0F172A]">Total Payouts:</td>
                                        <td className="px-4 py-3 text-right font-bold text-[#64748B]">
                                            {formatCurrency(allPayouts.reduce((acc, p) => acc + p.amount + getB2BCharge(p.amount), 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-red-500">
                                            -{formatCurrency(allPayouts.reduce((acc, p) => acc + getB2BCharge(p.amount), 0))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                                            {formatCurrency(totalPaid)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {showEditModal && (
                <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                        {/* Header */}
                        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-[15px] font-semibold text-[#0F172A]">Edit Landlord Client Profile</h3>
                                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">Modify profile, commission settings and properties</p>
                            </div>
                            <button onClick={() => { setShowEditModal(false); setSelectedClient(null); }} className="text-[#94A3B8] hover:text-[#0f172a] transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body / Scrollable Form */}
                        <form onSubmit={handleUpdateClient} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">{formError}</div>}
                            {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> {formSuccess}</div>}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Landlord Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. EDWARD KARIUKI HIUHU"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="e.g. edward@hiuhu.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 254743466932"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Account Name (Beneficiary)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe / Real Estate Ltd"
                                    value={formData.accountName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                                        <Percent size={11} /> Agency Commission Rate *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        placeholder="e.g. 10"
                                        value={formData.commissionRate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Preferred Payout Disbursal</label>
                                    <select
                                        value={formData.payoutMethod}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payoutMethod: e.target.value, payoutDetails: '' }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] uppercase"
                                    >
                                        <option value="mpesa_b2c">M-Pesa B2C (Phone Number)</option>
                                        <option value="mpesa_b2b_till">M-Pesa B2B (Buy Goods/Till)</option>
                                        <option value="mpesa_b2b_paybill">M-Pesa B2B (Paybill)</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash Outflow</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {formData.payoutMethod === 'mpesa_b2c' && (
                                    <>
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">M-Pesa Phone Number *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 254712345678"
                                            value={formData.payoutDetails}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                        />
                                        <p className="text-[9px] text-[#94A3B8] mt-1">Must be a valid Safaricom registered number for automated B2C routing.</p>
                                    </>
                                )}
                                {formData.payoutMethod === 'mpesa_b2b_till' && (
                                    <>
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">M-Pesa Till Number *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 123456"
                                            value={formData.payoutDetails}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                        />
                                        <p className="text-[9px] text-[#94A3B8] mt-1">Enter the 6-digit Buy Goods Till Number.</p>
                                    </>
                                )}
                                {formData.payoutMethod === 'mpesa_b2b_paybill' && (
                                    <>
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">M-Pesa Paybill Details *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Paybill 123456 Acc 789"
                                            value={formData.payoutDetails}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                        />
                                        <p className="text-[9px] text-[#94A3B8] mt-1">Include both Paybill and Account Number in a structured format.</p>
                                    </>
                                )}
                                {formData.payoutMethod === 'bank' && (
                                    <>
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Bank Account Details *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Equity Bank Acc 1210167890123"
                                            value={formData.payoutDetails}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                        />
                                    </>
                                )}
                                {formData.payoutMethod === 'cash' && (
                                    <>
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Cash Collection Notes</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Collects at the office on the 5th"
                                            value={formData.payoutDetails}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                        />
                                    </>
                                )}
                            </div>

                            {/* Assigned Properties Checkbox list */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Link Managed Properties</label>
                                <div className="border border-[#E2E8F0] rounded-lg p-3 max-h-36 overflow-y-auto bg-[#F8FAFC] space-y-1.5">
                                    {properties.length === 0 ? (
                                        <div className="text-center text-xs text-[#94A3B8] py-2">No active properties available in agency database.</div>
                                    ) : (
                                        properties.map(p => {
                                            const isSelected = formData.assignedProperties.includes(p.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={p.id}
                                                    onClick={() => togglePropertySelection(p.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all ${isSelected
                                                        ? 'bg-[#F0F6FF] text-[#007AFF] font-semibold border border-[#BFDBFE]'
                                                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-1.5"><Building2 size={11} /> {p.propertyName}</span>
                                                    <span className="text-[9px] uppercase tracking-widest">{isSelected ? 'Linked' : 'Link'}</span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Internal Notes</label>
                                <textarea
                                    placeholder="Add any internal guidelines or records..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md py-2 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] h-16 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedClient(null); }}
                                    className="h-9 px-4 rounded-md border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-[12px] font-semibold text-[#64748B]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="h-9 px-4 rounded-md bg-[#007AFF] hover:bg-blue-600 text-white font-semibold text-[12px] transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: Record Payout (Pay Client) ── */}
            {showPayoutModal && (
                (() => {
                    const isLiveMpesa = (integrationTier === 'tier2' || mpesaBalances?.isLive) && payoutForm.paymentMethod === 'mpesa';
                    const mpesaType = selectedClient?.payoutMethod === 'mpesa_b2c' ? 'B2C (Phone)' :
                        selectedClient?.payoutMethod === 'mpesa_b2b_till' ? 'B2B (Till)' :
                            selectedClient?.payoutMethod === 'mpesa_b2b_paybill' ? 'B2B (Paybill)' : 'M-Pesa';

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
                                <form onSubmit={handleRecordPayout} className="p-5 space-y-3">
                                    {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">{formError}</div>}
                                    {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> {formSuccess}</div>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Left Column: Financial Ledger Statement */}
                                        <div className="space-y-3">
                                            {/* Compact Balance Card */}
                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block">Available Outstanding Payout</span>
                                                    <span className="text-[9px] text-[#64748B] block mt-0.5">Disbursed to: {selectedClient?.name}</span>
                                                </div>
                                                <h4 className="text-lg font-extrabold text-amber-600">{formatCurrency(dynamicNetOutstanding)}</h4>
                                            </div>

                                            {/* Compact Remittance Statement */}
                                            <div className="bg-[#F8FAFC]/55 border border-[#E2E8F0] rounded-lg px-4 py-2.5">
                                                <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-2 text-center">Remittance Calculation Statement</span>
                                                <div className="space-y-1.5 text-[11px] text-[#475569]">
                                                    <div className="flex justify-between items-center">
                                                        <span>Gross Rent Collected</span>
                                                        <span className="font-semibold text-[#0F172A]">{formatCurrency(selectedClient?.totalCollected || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-blue-600">
                                                        <span>Agency Commission Deducted</span>
                                                        <span className="font-semibold">- {formatCurrency(selectedClient?.totalCommission || 0)}</span>
                                                    </div>
                                                    <div className={`flex justify-between items-center text-red-600 ${!payoutForm.deductExpenses ? 'opacity-30 line-through' : ''}`}>
                                                        <span>Operating Expenses Incurred</span>
                                                        <span className="font-semibold">- {formatCurrency(selectedClient?.totalExpenses || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[#64748B] pb-1.5 border-b border-[#F1F5F9]">
                                                        <span>Total Disbursed Already</span>
                                                        <span className="font-semibold">- {formatCurrency(selectedClient?.totalPaid || 0)}</span>
                                                    </div>
                                                    <div className="pt-1 flex justify-between items-center font-bold text-[#0F172A] text-xs">
                                                        <span>Net Outstanding Payout</span>
                                                        <span className="text-amber-600">{formatCurrency(dynamicNetOutstanding)}</span>
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
                                                        step="1"
                                                        min="1"
                                                        max={dynamicNetOutstanding}
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
                                                        value={selectedClient?.accountName || ''}
                                                        placeholder="Not Set"
                                                        className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-md h-9 px-2 text-[11px] outline-none text-[#64748B] font-semibold truncate"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-[#F1F5F9] mt-2">
                                                <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">Transaction Options</label>
                                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {/* Deduct Expenses */}
                                                    <div className="flex items-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="chk-deduct-expenses"
                                                            checked={payoutForm.deductExpenses}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                const newNet = Math.round((selectedClient?.totalCollected || 0) - (selectedClient?.totalCommission || 0) - (isChecked ? (selectedClient?.totalExpenses || 0) : 0) - (selectedClient?.totalPaid || 0));
                                                                setPayoutForm(prev => ({ ...prev, deductExpenses: isChecked, amount: newNet > 0 ? String(newNet) : '' }));
                                                            }}
                                                            className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF] mt-0.5 cursor-pointer"
                                                        />
                                                        <label htmlFor="chk-deduct-expenses" className="text-[10px] font-medium text-[#475569] leading-snug cursor-pointer select-none">
                                                            Deduct<br /><span className="text-[#94A3B8] font-normal">Expenses</span>
                                                        </label>
                                                    </div>

                                                    {/* Email Receipt */}
                                                    <div className="flex items-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="chk-email-payout-opt"
                                                            checked={payoutForm.sendEmail !== false}
                                                            onChange={(e) => setPayoutForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                                                            className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF] mt-0.5 cursor-pointer"
                                                        />
                                                        <label htmlFor="chk-email-payout-opt" className="text-[10px] font-medium text-[#475569] leading-snug cursor-pointer select-none truncate" title={selectedClient?.email}>
                                                            Email to<br /><span className="text-[#94A3B8] font-normal truncate max-w-[90px] block">{selectedClient?.email || 'None'}</span>
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
                                                        <label htmlFor="chk-sms-payout-opt" className="text-[10px] font-medium text-[#475569] leading-snug cursor-pointer select-none truncate" title={selectedClient?.phone}>
                                                            SMS to<br /><span className="text-[#94A3B8] font-normal truncate max-w-[90px] block">{selectedClient?.phone || 'None'}</span>
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
                                            onClick={() => { setShowPayoutModal(false); setSelectedClient(null); }}
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
        </div>
    );
}
