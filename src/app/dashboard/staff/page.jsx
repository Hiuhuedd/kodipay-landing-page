'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Users, UserPlus, Building2, Mail, Phone, 
    Shield, Search, X, CheckCircle2, Plus, 
    Power, PowerOff, LayoutGrid, List,
    MapPin, Fingerprint, Info, Edit
} from 'lucide-react';
import { 
    getSubagents, createSubagent, getProperties, 
    fetchAPI 
} from '@/lib/api';
import { PageHeader, Modal, LoadingPage, Toast, ConfirmModal } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function StaffManagementPage() {
    const [subagents, setSubagents] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const router = useRouter();
    
    // UI states
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [propSearch, setPropSearch] = useState('');

    // Form states
    const [newAgent, setNewAgent] = useState({ name: '', email: '', phone: '', location: '', nationalId: '', emergencyContact: '' });
    const [editAgent, setEditAgent] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [agentsRes, propsRes] = await Promise.all([
                getSubagents(),
                getProperties()
            ]);
            setSubagents(agentsRes.data || []);
            setProperties(propsRes?.data || propsRes || []);
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to load staff data' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await createSubagent(newAgent);
            if (res.success) {
                setSubagents(prev => [...prev, res.data]);
                setNewAgent({ name: '', email: '', phone: '', location: '', nationalId: '', emergencyContact: '' });
                setShowAddModal(false);
                setToast({ type: 'success', message: `Subagent ${newAgent.name} created successfully` });
            } else {
                setToast({ type: 'error', message: res.error });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Error creating subagent' });
        } finally {
            setSaving(false);
        }
    };

    const toggleAgentStatus = (agent) => {
        const isActivating = agent.status !== 'active';
        setConfirm({
            title: isActivating ? 'Reactivate Subagent' : 'Deactivate Subagent',
            message: isActivating 
                ? `This will restore ${agent.name}'s access to KodiPay. They will be able to log in and manage properties again.` 
                : `This will immediately remove ${agent.name}'s ability to log into KodiPay. Their past records and collections will be kept safe.`,
            confirmText: isActivating ? 'Yes, Reactivate' : 'Yes, Deactivate',
            type: isActivating ? 'primary' : 'danger',
            onConfirm: async () => {
                try {
                    const newStatus = isActivating ? 'active' : 'inactive';
                    await fetchAPI('/admin/subagents/status', {
                        method: 'POST',
                        body: JSON.stringify({ subagentUid: agent.uid, status: newStatus })
                    });
                    setSubagents(prev => prev.map(a => a.uid === agent.uid ? { ...a, status: newStatus } : a));
                    setToast({ type: 'success', message: `${agent.name} is now ${newStatus}` });
                } catch (err) {
                    setToast({ type: 'error', message: 'Failed to update status' });
                }
                setConfirm(null);
            }
        });
    };

    const handleUpdateAgent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetchAPI('/admin/subagents', {
                method: 'PUT',
                body: JSON.stringify({ subagentUid: editAgent.uid, ...editAgent })
            });
            if (res.success) {
                setSubagents(prev => prev.map(a => a.uid === editAgent.uid ? { ...a, ...editAgent } : a));
                setShowEditModal(false);
                setToast({ type: 'success', message: 'Staff profile updated successfully' });
            } else {
                setToast({ type: 'error', message: res.error });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Error updating staff' });
        } finally {
            setSaving(false);
        }
    };

    const filteredAgents = useMemo(() => {
        return subagents.filter(a => 
            a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subagents, searchTerm]);

    if (loading) return <LoadingPage />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Staff Management</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Manage your agency team and property access</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-md border border-[#E2E8F0] p-1">
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
                        >
                            <List size={15} />
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                        <UserPlus size={15} /> Add New Staff
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input 
                        type="text"
                        placeholder="Search staff by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-lg focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                </div>

                {filteredAgents.length === 0 ? (
                    <div className="py-20 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#E2E8F0]">
                        <Users size={40} className="mx-auto text-[#94A3B8] mb-4" />
                        <h3 className="text-sm font-medium text-[#0F172A]">No staff found</h3>
                        <p className="text-[#64748B] text-xs mt-1">No subagents match your search or have been added yet.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAgents.map(agent => (
                            <AgentCard 
                                key={agent.uid} 
                                agent={agent} 
                                onAssign={() => router.push(`/dashboard/staff/${agent.uid}/assign`)}
                                onToggleStatus={() => toggleAgentStatus(agent)}
                                onEdit={() => { setEditAgent(agent); setShowEditModal(true); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden divide-y divide-[#F1F5F9]">
                        {filteredAgents.map(agent => (
                            <AgentRow 
                                key={agent.uid} 
                                agent={agent} 
                                onAssign={() => router.push(`/dashboard/staff/${agent.uid}/assign`)}
                                onToggleStatus={() => toggleAgentStatus(agent)}
                                onEdit={() => { setEditAgent(agent); setShowEditModal(true); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

            {showAddModal && (
                <Modal title="Add New Subagent" onClose={() => setShowAddModal(false)} maxWidth="max-w-3xl">
                    <form onSubmit={handleCreateAgent} className="space-y-5 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Full Name</label>
                                <input
                                    required
                                    placeholder="Enter subagent's full name"
                                    className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                    value={newAgent.name}
                                    onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="subagent@example.com"
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                        value={newAgent.email}
                                        onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        required
                                        placeholder="07XX XXX XXX"
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                        value={newAgent.phone}
                                        onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">National ID</label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        placeholder="ID Number"
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                        value={newAgent.nationalId}
                                        onChange={e => setNewAgent({...newAgent, nationalId: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Location / Area Scope</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        placeholder="e.g. Nairobi Central"
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                        value={newAgent.location}
                                        onChange={e => setNewAgent({...newAgent, location: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Emergency Contact</label>
                                <input
                                    placeholder="Name & Contact Number"
                                    className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                                    value={newAgent.emergencyContact}
                                    onChange={e => setNewAgent({...newAgent, emergencyContact: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="h-10 px-5 border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="h-10 px-5 bg-[#007AFF] text-white rounded-md text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Adding Staff...' : 'Create Staff Account'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {showEditModal && editAgent && (
                <Modal title="Edit Staff Details" onClose={() => setShowEditModal(false)} maxWidth="max-w-3xl">
                    <form onSubmit={handleUpdateAgent} className="space-y-5 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Full Name</label>
                                <input
                                    required
                                    className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                    value={editAgent.name}
                                    onChange={e => setEditAgent({...editAgent, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Email Address (Read Only)</label>
                                <input
                                    disabled
                                    className="w-full h-10 px-4 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] font-medium text-[13px] cursor-not-allowed"
                                    value={editAgent.email}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Phone Number</label>
                                <input
                                    required
                                    className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                    value={editAgent.phone}
                                    onChange={e => setEditAgent({...editAgent, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">National ID</label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                        value={editAgent.nationalId || ''}
                                        onChange={e => setEditAgent({...editAgent, nationalId: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Location / Area Scope</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                    <input
                                        className="w-full h-10 pl-9 pr-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                        value={editAgent.location || ''}
                                        onChange={e => setEditAgent({...editAgent, location: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Emergency Contact</label>
                                <input
                                    placeholder="Name & Number"
                                    className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                    value={editAgent.emergencyContact || ''}
                                    onChange={e => setEditAgent({...editAgent, emergencyContact: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="h-10 px-5 border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="h-10 px-5 bg-[#0F172A] text-white rounded-md text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving Changes...' : 'Save Staff Details'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function AgentCard({ agent, onAssign, onToggleStatus, onEdit }) {
    const isActive = agent.status === 'active';
    return (
        <div className={`bg-white border border-[#E2E8F0] rounded-lg p-6 transition-all group relative overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
            {!isActive && <div className="absolute inset-0 bg-white/40 z-10" />}
            
            <div className="flex items-start justify-between relative z-20">
                <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${isActive ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#F8FAFC] text-[#94A3B8]'}`}>
                    <Shield size={20} />
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={onEdit}
                        className="flex items-center gap-1 h-7 px-2 border border-[#E2E8F0] rounded text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all cursor-pointer"
                    >
                        <Edit size={12} /> Edit
                    </button>
                    <button 
                        onClick={onToggleStatus}
                        className={`flex items-center justify-center w-7 h-7 rounded transition-all cursor-pointer ${isActive ? 'text-[#94A3B8] hover:bg-red-50 hover:text-red-600' : 'text-[#94A3B8] hover:bg-green-50 hover:text-green-600'}`}
                        title={isActive ? "Deactivate" : "Activate"}
                    >
                        {isActive ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                </div>
            </div>
            
            <div className="mt-5 relative z-20">
                <h3 className="font-semibold text-[#0F172A] text-[15px]">{agent.name}</h3>
                <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        <Mail size={13} className="text-[#CBD5E1]" /> {agent.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        <Phone size={13} className="text-[#CBD5E1]" /> {agent.phone}
                    </div>
                    {agent.location && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#007AFF]">
                            <MapPin size={13} className="text-blue-400" /> {agent.location}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] flex items-center justify-between relative z-20">
                <div>
                    <span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider block mb-0.5">Assigned</span>
                    <span className={`text-[13px] font-semibold ${isActive ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                        {agent.assignedProperties?.length || 0} Building{(agent.assignedProperties?.length || 0) !== 1 ? 's' : ''}
                    </span>
                </div>
                <button 
                    disabled={!isActive}
                    onClick={onAssign}
                    className="h-8 px-3 bg-[#F1F5F9] text-[#64748B] rounded text-[11px] font-medium hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all disabled:opacity-50"
                >
                    Assign
                </button>
            </div>
        </div>
    );
}

function AgentRow({ agent, onAssign, onToggleStatus, onEdit }) {
    const isActive = agent.status === 'active';
    return (
        <div className={`flex items-center justify-between px-6 py-4 transition-all ${!isActive ? 'bg-[#F8FAFC]/50 opacity-60' : 'hover:bg-[#F8FAFC]'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded flex items-center justify-center ${isActive ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#F8FAFC] text-[#94A3B8]'}`}>
                    <Shield size={18} />
                </div>
                <div>
                    <h4 className="font-medium text-[#0F172A] text-[13px] flex items-center gap-2">
                        {agent.name} 
                        {!isActive && <span className="text-[10px] text-red-500 font-medium uppercase tracking-wider">Inactive</span>}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{agent.email} · {agent.phone}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                    <span className="text-[13px] font-semibold text-[#0F172A] block">{agent.assignedProperties?.length || 0} Buildings</span>
                    <span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">Managed</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        disabled={!isActive}
                        onClick={onEdit}
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all disabled:opacity-0 cursor-pointer"
                    >
                        <Edit size={14} /> Edit
                    </button>
                    <button 
                        disabled={!isActive}
                        onClick={onAssign}
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-semibold text-[#007AFF] hover:bg-blue-50 transition-all disabled:opacity-0 cursor-pointer"
                    >
                        <Building2 size={14} /> Assign Properties
                    </button>
                    <button 
                        onClick={onToggleStatus}
                        className={`flex items-center justify-center w-8 h-8 rounded transition-all cursor-pointer ${isActive ? 'text-[#94A3B8] hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50'}`}
                        title={isActive ? "Deactivate" : "Activate"}
                    >
                        {isActive ? <PowerOff size={15} /> : <Power size={15} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
