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
    Briefcase
} from 'lucide-react';

export default function ClientManagementPage() {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    // Create/Edit form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        commissionRate: 10,
        payoutMethod: 'mpesa',
        payoutDetails: '',
        notes: '',
        assignedProperties: []
    });

    // Payout form state
    const [payoutForm, setPayoutForm] = useState({
        amount: '',
        paymentMethod: 'mpesa',
        referenceNumber: '',
        payoutMonth: getCurrentMonth(),
        notes: ''
    });

    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Fetch clients and properties
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [clientsRes, propsRes] = await Promise.all([
                fetchAPI('/clients'),
                getProperties()
            ]);

            setClients(clientsRes.data || []);
            setProperties(propsRes.data || propsRes || []);
        } catch (err) {
            console.error('Failed to load clients and properties:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
                // If properties are assigned, update them using PUT updateClient
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
                    payoutMethod: 'mpesa',
                    payoutDetails: '',
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

    const handleEditClientClick = (client) => {
        setSelectedClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            commissionRate: client.commissionRate || 10,
            payoutMethod: client.payoutMethod || 'mpesa',
            payoutDetails: client.payoutDetails || '',
            notes: client.notes || '',
            assignedProperties: (client.properties || []).map(p => p.id)
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
                    setFormSuccess('');
                    setSelectedClient(null);
                    loadData(true);
                }, 1500);
            }
        } catch (err) {
            setFormError(err.message || 'Failed to update client');
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (!confirm('Are you sure you want to permanently delete this client profile? All linked properties will be unlinked.')) {
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
        setPayoutForm({
            amount: client.outstandingPayout > 0 ? String(client.outstandingPayout) : '',
            paymentMethod: client.payoutMethod || 'mpesa',
            referenceNumber: '',
            payoutMonth: getCurrentMonth(),
            notes: ''
        });
        setFormError('');
        setFormSuccess('');
        setShowPayoutModal(true);
    };

    const handleRecordPayout = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const amountNum = parseFloat(payoutForm.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setFormError('A valid payout amount greater than KSh 0 is required');
            return;
        }

        try {
            const result = await fetchAPI(`/clients/${selectedClient.id}/payouts`, {
                method: 'POST',
                body: JSON.stringify(payoutForm)
            });

            if (result.success) {
                setFormSuccess(`Payout of ${formatCurrency(amountNum)} recorded and client receipt emailed!`);
                setTimeout(() => {
                    setShowPayoutModal(false);
                    setFormSuccess('');
                    setSelectedClient(null);
                    loadData(true);
                }, 2000);
            }
        } catch (err) {
            setFormError(err.message || 'Failed to record payout');
        }
    };



    // Filters & Metrics
    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const totalCollected = clients.reduce((acc, c) => acc + (c.totalCollected || 0), 0);
    const totalExpenses = clients.reduce((acc, c) => acc + (c.totalExpenses || 0), 0);
    const totalPaid = clients.reduce((acc, c) => acc + (c.totalPaid || 0), 0);
    const totalOutstanding = clients.reduce((acc, c) => acc + (c.outstandingPayout || 0), 0);

    const togglePropertySelection = (propId) => {
        setFormData(prev => {
            const exists = prev.assignedProperties.includes(propId);
            return {
                ...prev,
                assignedProperties: exists 
                    ? prev.assignedProperties.filter(id => id !== propId)
                    : [...prev.assignedProperties, propId]
            };
        });
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">Landlord Client Management</h2>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-widest">Manage Landlord Profiles & Payouts</p>
                </div>
            </div>

            {/* ── Key Metrics Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <X size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Operating Expenses</span>
                        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] mt-0.5">{formatCurrency(totalExpenses)}</h3>
                    </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 max-w-md shadow-sm">
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

            {/* ── Client Management Table ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                {filteredClients.length === 0 ? (
                    <div className="py-16 text-center">
                        <Briefcase size={36} className="text-[#94A3B8] mx-auto mb-3" />
                        <h3 className="text-[14px] font-semibold text-[#0F172A]">No landlord profiles found</h3>
                        <p className="text-xs text-[#94A3B8] mt-1">Landlord profiles are automatically created and updated when you register or edit properties!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider w-1/4">Landlord Profile</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-center">Properties</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Collected (Gross)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Expenses Incurred</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Outstanding (Net)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Total Paid</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {filteredClients.map((client) => {
                                    return (
                                        <tr 
                                            key={client.id} 
                                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                            className="hover:bg-[#F8FAFC]/50 transition-colors group cursor-pointer"
                                        >
                                            {/* Profile Cell */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 text-xs font-semibold">
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[13px] font-semibold text-[#0F172A] truncate">
                                                            {client.name}
                                                        </h4>
                                                        <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-[#64748B]">
                                                            {client.phone && <span className="flex items-center gap-1"><Phone size={10} /> {client.phone}</span>}
                                                            {client.email && <span className="flex items-center gap-1 truncate"><Mail size={10} /> {client.email}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned properties count */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-[12px] text-[#0F172A] font-medium">
                                                    <Building2 size={12} className="text-[#94A3B8]" />
                                                    {client.propertiesCount}
                                                </span>
                                            </td>

                                            {/* Total rent collected */}
                                            <td className="px-6 py-4 text-right text-[13px] font-medium text-[#64748B]">
                                                {formatCurrency(client.totalCollected)}
                                            </td>

                                            {/* Total Expenses Incurred */}
                                            <td className="px-6 py-4 text-right text-[13px] font-medium text-red-600">
                                                {formatCurrency(client.totalExpenses || 0)}
                                            </td>

                                            {/* Outstanding Payout */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[13px] font-semibold ${client.outstandingPayout > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {formatCurrency(client.outstandingPayout)}
                                                </span>
                                            </td>

                                            {/* Total paid payouts */}
                                            <td className="px-6 py-4 text-right text-[13px] font-semibold text-emerald-600">
                                                {formatCurrency(client.totalPaid)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        disabled={client.outstandingPayout <= 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePayoutClick(client);
                                                        }}
                                                        className={`h-7 px-2.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                                                            client.outstandingPayout > 0
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                                            : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <ArrowUpRight size={11} /> Pay
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClient(client.id);
                                                        }}
                                                        className="h-7 w-7 rounded bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors border border-red-100"
                                                        title="Delete profile"
                                                    >
                                                        <Trash2 size={13} />
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



            {/* ── MODAL: Edit Landlord Client ── */}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, payoutMethod: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] uppercase"
                                    >
                                        <option value="mpesa">M-Pesa Mobile Money</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash Outflow</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Payout Details (Account or Wallet Info)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paybill Acc 0743466932 or Equity Acc 1210167890123"
                                    value={formData.payoutDetails}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payoutDetails: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                />
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
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all ${
                                                        isSelected 
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
                <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-zoom-in">
                        {/* Header */}
                        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-[15px] font-semibold text-[#0F172A]">Disburse & Record Payout</h3>
                                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">Disburse net collected funds to landlord</p>
                            </div>
                            <button onClick={() => { setShowPayoutModal(false); setSelectedClient(null); }} className="text-[#94A3B8] hover:text-[#0f172a] transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRecordPayout} className="p-6 space-y-4">
                            {formError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">{formError}</div>}
                            {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> {formSuccess}</div>}

                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 text-center">
                                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">Available Outstanding Payout</span>
                                <h4 className="text-xl font-bold text-[#0F172A] mt-1">{formatCurrency(selectedClient?.outstandingPayout)}</h4>
                                <span className="text-[9px] text-[#94A3B8] block mt-1">Disbursed to: {selectedClient?.name}</span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Payout Amount (KSh) *</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0.01"
                                    max={selectedClient?.outstandingPayout}
                                    placeholder="Enter payout amount"
                                    value={payoutForm.amount}
                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Disbursal Method *</label>
                                    <select
                                        value={payoutForm.paymentMethod}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] uppercase"
                                    >
                                        <option value="mpesa">M-Pesa Paybill</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash Disbursal</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Payout Month *</label>
                                    <input
                                        type="month"
                                        required
                                        value={payoutForm.payoutMonth}
                                        onChange={(e) => setPayoutForm(prev => ({ ...prev, payoutMonth: e.target.value }))}
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Reference Number (M-Pesa or Bank ID)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. QXX890J23K or TXN-2908"
                                    value={payoutForm.referenceNumber}
                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md h-9 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] font-mono font-bold uppercase"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Transaction Notes / Email Description</label>
                                <textarea
                                    placeholder="Include payment notes that will be detailed on client receipt..."
                                    value={payoutForm.notes}
                                    onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md py-2 px-3 text-[13px] outline-none focus:border-[#007AFF] transition-colors text-[#0F172A] h-16 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="chk-email-payout"
                                    defaultChecked
                                    disabled
                                    className="rounded border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]"
                                />
                                <label htmlFor="chk-email-payout" className="text-[11px] font-medium text-[#64748B] flex items-center gap-1">
                                    <Mail size={12} className="text-[#94A3B8]" /> Email styled payment receipt invoice to {selectedClient?.email || 'landlord'}
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
                                <button
                                    type="button"
                                    onClick={() => { setShowPayoutModal(false); setSelectedClient(null); }}
                                    className="h-9 px-4 rounded-md border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-[12px] font-semibold text-[#64748B]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="h-9 px-4 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[12px] transition-colors flex items-center gap-1"
                                >
                                    Record Disbursal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
