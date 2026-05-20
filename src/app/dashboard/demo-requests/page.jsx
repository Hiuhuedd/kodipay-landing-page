'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Users, Phone, Mail, Calendar, Building2, 
    Sparkles, CheckCircle2, Clock, Search, 
    Filter, RefreshCw, ChevronRight, UserCheck
} from 'lucide-react';
import { 
    getDemoRequests, 
    updateDemoRequestStatus,
    formatDate
} from '@/lib/api';
import { LoadingPage, Toast, ConfirmModal } from '@/components/ui';

export default function DemoRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'contacted' | 'completed'
    const [toast, setToast] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getDemoRequests();
            if (res.success) {
                setRequests(res.requests || []);
            } else {
                setToast({ type: 'error', message: res.error || 'Failed to fetch demo requests' });
            }
        } catch (err) {
            console.error('Fetch requests error:', err);
            setToast({ type: 'error', message: 'Failed to load demo requests' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const res = await updateDemoRequestStatus(id, newStatus);
            if (res.success) {
                setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
                setToast({ type: 'success', message: `Request status updated to ${newStatus}` });
            } else {
                setToast({ type: 'error', message: res.error || 'Failed to update status' });
            }
        } catch (err) {
            console.error('Update status error:', err);
            setToast({ type: 'error', message: 'Error updating request status' });
        } finally {
            setUpdatingId(null);
        }
    };

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const contacted = requests.filter(r => r.status === 'contacted').length;
        const completed = requests.filter(r => r.status === 'completed').length;
        return { total, pending, contacted, completed };
    }, [requests]);

    // Filter and search logic
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesSearch = 
                req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.phone?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, statusFilter]);

    if (loading) return <LoadingPage />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Demo Requests</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Monitor leads and platform demo bookings</p>
                </div>
                <button 
                    onClick={fetchRequests}
                    className="flex items-center gap-1.5 h-9 px-3.5 border border-[#E2E8F0] bg-white text-[#64748B] rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <RefreshCw size={13} /> Refresh List
                </button>
            </div>

            {/* ── Stat Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Bookings</span>
                        <div className="w-7 h-7 rounded-md bg-blue-50 text-[#007AFF] flex items-center justify-center">
                            <Sparkles size={14} />
                        </div>
                    </div>
                    <div className="mt-3.5">
                        <span className="text-2xl font-bold text-[#0F172A]">{stats.total}</span>
                        <span className="text-[10px] text-[#64748B] block mt-0.5">Submitted from landing page</span>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Pending Tasks</span>
                        <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={14} />
                        </div>
                    </div>
                    <div className="mt-3.5">
                        <span className="text-2xl font-bold text-[#0F172A]">{stats.pending}</span>
                        <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Requires SMS / Call contact</span>
                    </div>
                </div>

                {/* Contacted */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">In Progress</span>
                        <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Phone size={14} />
                        </div>
                    </div>
                    <div className="mt-3.5">
                        <span className="text-2xl font-bold text-[#0F172A]">{stats.contacted}</span>
                        <span className="text-[10px] text-sky-600 font-medium block mt-0.5">Contacted / Scheduled</span>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Onboarded</span>
                        <div className="w-7 h-7 rounded-md bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle2 size={14} />
                        </div>
                    </div>
                    <div className="mt-3.5">
                        <span className="text-2xl font-bold text-[#0F172A]">{stats.completed}</span>
                        <span className="text-[10px] text-green-600 font-medium block mt-0.5">Demo done / Signed up</span>
                    </div>
                </div>
            </div>

            {/* ── Table & Operations Section ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                {/* Header Controls */}
                <div className="p-5 border-b border-[#F1F5F9] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FAFC]/50">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-lg self-start">
                        {['all', 'pending', 'contacted', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    statusFilter === tab 
                                    ? 'bg-white text-[#0F172A] shadow-sm' 
                                    : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-xs font-semibold text-[#0F172A] placeholder:text-[#94A3B8]"
                        />
                    </div>
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto">
                    {filteredRequests.length === 0 ? (
                        <div className="py-20 text-center">
                            <Users size={32} className="mx-auto text-[#94A3B8] mb-3" />
                            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">No matching requests</h3>
                            <p className="text-[#64748B] text-[11px] mt-1">Try adjusting your filters or search keywords.</p>
                        </div>
                    ) : (
                        <table className="w-full text-[13px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/30">
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Contact Info</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Portfolio Size</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Booked Date</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                        {/* Contact */}
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-[#0F172A]">{req.name}</div>
                                            <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-[#64748B]">
                                                <span className="flex items-center gap-1.5">
                                                    <Phone size={11} className="text-[#94A3B8]" /> {req.phone}
                                                </span>
                                                {req.email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail size={11} className="text-[#94A3B8]" /> {req.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Portfolio size */}
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-100 text-xs font-semibold text-[#334155]">
                                                <Building2 size={12} className="text-slate-400" />
                                                {req.portfolioSize} units
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 text-xs font-medium text-[#475569]">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-[#94A3B8]" />
                                                {formatDate(req.createdAt)}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                req.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    : req.status === 'contacted'
                                                        ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                                        : 'bg-green-50 text-green-700 border border-green-100'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {req.status === 'pending' && (
                                                    <button
                                                        disabled={updatingId === req.id}
                                                        onClick={() => handleStatusUpdate(req.id, 'contacted')}
                                                        className="h-7 px-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        Mark Contacted
                                                    </button>
                                                )}
                                                {req.status !== 'completed' && (
                                                    <button
                                                        disabled={updatingId === req.id}
                                                        onClick={() => handleStatusUpdate(req.id, 'completed')}
                                                        className="h-7 px-2.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        Mark Onboarded
                                                    </button>
                                                )}
                                                {req.status === 'completed' && (
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-green-600 uppercase tracking-wider px-2">
                                                        <UserCheck size={13} /> Complete
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
