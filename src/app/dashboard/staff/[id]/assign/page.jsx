'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Building2, Shield, Search, Plus, 
    ArrowLeft, Loader2, MapPin, AlertCircle, X 
} from 'lucide-react';
import { 
    getSubagents, getProperties, assignProperty, unassignProperty 
} from '@/lib/api';
import { LoadingPage, Toast } from '@/components/ui';

export default function AssignPropertiesPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [subagent, setSubagent] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionId, setActionId] = useState(null); // track current loading state of assign/unassign action
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [agentsRes, propsRes] = await Promise.all([
                getSubagents(),
                getProperties()
            ]);
            
            const agentList = agentsRes.data || [];
            const agent = agentList.find(a => a.uid === id);
            
            if (!agent) {
                setToast({ type: 'error', message: 'Subagent profile not found' });
            } else {
                setSubagent(agent);
            }
            
            setProperties(propsRes?.data || propsRes || []);
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Failed to load assignment data' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (propertyId) => {
        setActionId(propertyId);
        try {
            const res = await assignProperty(id, propertyId);
            if (res.success) {
                setSubagent(prev => ({
                    ...prev,
                    assignedProperties: [...(prev.assignedProperties || []), propertyId]
                }));
                setToast({ type: 'success', message: 'Property assigned successfully' });
            } else {
                setToast({ type: 'error', message: res.error || 'Assignment failed' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to assign property' });
        } finally {
            setActionId(null);
        }
    };

    const handleUnassign = async (propertyId) => {
        setActionId(propertyId);
        try {
            const res = await unassignProperty(id, propertyId);
            if (res.success) {
                setSubagent(prev => ({
                    ...prev,
                    assignedProperties: (prev.assignedProperties || []).filter(pid => pid !== propertyId)
                }));
                setToast({ type: 'success', message: 'Property access revoked successfully' });
            } else {
                setToast({ type: 'error', message: res.error || 'Revocation failed' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to revoke property' });
        } finally {
            setActionId(null);
        }
    };

    const filteredProperties = useMemo(() => {
        return properties.filter(p => 
            p.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [properties, searchTerm]);

    const { assigned, available } = useMemo(() => {
        const assignedList = [];
        const availableList = [];
        
        filteredProperties.forEach(p => {
            const pId = p.id || p.propertyId;
            const isAssigned = subagent?.assignedProperties?.includes(pId);
            if (isAssigned) {
                assignedList.push(p);
            } else {
                availableList.push(p);
            }
        });
        
        return { assigned: assignedList, available: availableList };
    }, [filteredProperties, subagent]);

    if (loading) return <LoadingPage />;
    if (!subagent) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center space-y-4">
                <AlertCircle size={40} className="mx-auto text-rose-500" />
                <h2 className="text-lg font-bold text-[#0F172A]">Staff member not found</h2>
                <button
                    onClick={() => router.push('/dashboard/staff')}
                    className="inline-flex items-center gap-2 h-9 px-4 bg-[#F1F5F9] text-[#0F172A] rounded-md text-xs font-semibold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                >
                    <ArrowLeft size={14} /> Back to My Team
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/staff')}
                        className="p-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Manage Property Access</h1>
                        <p className="text-[12px] text-[#64748B] mt-0.5 font-medium">Assign properties to control collection and subagent visibility scopes.</p>
                    </div>
                </div>
            </div>

            {/* Subagent Horizontal Profile Banner */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-[#007AFF] to-[#0051FF]"></div>
                
                <div className="flex items-center gap-4 pl-1">
                    <div className="w-10 h-10 rounded-full border border-[#E2E8F0] bg-slate-50 flex items-center justify-center text-[#0F172A] font-bold text-sm shadow-inner shrink-0">
                        {subagent.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">{subagent.name}</h2>
                            <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] rounded text-[9px] font-bold uppercase tracking-wider">
                                {subagent.role || 'Subagent'}
                            </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] font-medium mt-0.5">{subagent.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 md:gap-12 md:pr-4 text-xs">
                    <div>
                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider block">Phone Number</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">{subagent.phone || '—'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider block">Assigned Portfolio</span>
                        <span className="font-bold text-[#007AFF] mt-0.5 block">{subagent.assignedProperties?.length || 0} Buildings</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider block">Location Scope</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">{subagent.location || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                <input 
                    type="text"
                    placeholder="Filter properties by name or location..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-11 pr-4 bg-white border border-[#E2E8F0] rounded-lg focus:border-[#007AFF] outline-none transition-all text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned Properties Section */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#0F172A]">Assigned Portfolio ({assigned.length})</h3>
                        <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">Has Access</span>
                    </div>
                    <div className="divide-y divide-[#F1F5F9]">
                        {assigned.length > 0 ? (
                            assigned.map(prop => {
                                const pId = prop.id || prop.propertyId;
                                const isActing = actionId === pId;
                                return (
                                    <div key={pId} className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC]/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-50 text-[#007AFF] flex items-center justify-center border border-[#D9E9FF]">
                                                <Building2 size={15} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-xs text-[#0F172A]">{prop.propertyName}</h4>
                                                <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                                    <MapPin size={9} /> {prop.location || prop.address || 'Location unspecified'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isActing}
                                            onClick={() => handleUnassign(pId)}
                                            className="h-7 px-3 bg-red-50 text-red-600 rounded text-[10px] font-bold hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                        >
                                            {isActing ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Revoke
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-xs text-[#64748B] italic">
                                No properties assigned to this subagent.
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Properties Section */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#0F172A]">Available Properties ({available.length})</h3>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Unassigned</span>
                    </div>
                    <div className="divide-y divide-[#F1F5F9]">
                        {available.length > 0 ? (
                            available.map(prop => {
                                const pId = prop.id || prop.propertyId;
                                const isActing = actionId === pId;
                                return (
                                    <div key={pId} className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC]/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-50 text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
                                                <Building2 size={15} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-xs text-[#0F172A]">{prop.propertyName}</h4>
                                                <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                                    <MapPin size={9} /> {prop.location || prop.address || 'Location unspecified'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isActing}
                                            onClick={() => handleAssign(pId)}
                                            className="h-7 px-3 bg-blue-50 text-[#007AFF] rounded text-[10px] font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                        >
                                            {isActing ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Assign
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-xs text-[#64748B] italic">
                                All properties are already assigned.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
