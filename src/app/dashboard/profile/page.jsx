'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    User, Mail, Phone, Shield, Building2,
    Edit2, CheckCircle2, AlertCircle,
    Calendar, MapPin, Key, MessageSquare, Bell, ArrowRight, Zap
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getUserProfile, updateUserProfile, getProperties, getSmsUsage } from '@/lib/api';
import { LoadingPage, Toast, Modal } from '@/components/ui';

export default function ProfilePage() {
    const { user, isAdmin } = useAuth();
    const [profile, setProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [smsUsage, setSmsUsage] = useState(null);
    const [smsRemaining, setSmsRemaining] = useState(2000);

    // Edit form state
    const [editForm, setEditForm] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const [profileRes, propsRes] = await Promise.all([
                getUserProfile(),
                getProperties()
            ]);

            setProfile(profileRes.data);
            setProperties(propsRes.data || propsRes || []);
            setEditForm({
                name: profileRes.data.name || '',
                phone: profileRes.data.phone || ''
            });

            // Fetch SMS remaining if admin
            if (profileRes.data?.role === 'admin' || profileRes.data?.role === 'agency' || profileRes.data?.role === 'superadmin' || isAdmin) {
                try {
                    const smsData = await getSmsUsage();
                    const raw = smsData?.data || smsData;
                    setSmsUsage(raw);
                    const sent = raw?.monthlySent || 0;
                    const limit = raw?.monthlyLimit || 2000;
                    setSmsRemaining(Math.max(0, limit - sent));
                } catch (e) {
                    console.error('Failed to load SMS remaining in profile:', e);
                }
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to load profile data' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateUserProfile(editForm);
            if (res.success) {
                setProfile(prev => ({ ...prev, ...editForm }));
                setShowEditModal(false);
                setToast({ type: 'success', message: 'Profile updated successfully' });
            } else {
                setToast({ type: 'error', message: res.error });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Error updating profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingPage />;

    const assignedProps = isAdmin
        ? []
        : properties.filter(p => {
            const pId = p.id || p.propertyId;
            return profile?.assignedProperties?.includes(pId);
        });

    // Calculate dynamic limits and parameters
    const activePlanName = smsUsage?.subscription?.activePlan || 'starter_trial';
    const planStatus = smsUsage?.subscription?.status || 'trial';
    const propertiesLimit = smsUsage?.subscription?.propertiesLimit || 2;
    const unitsLimit = smsUsage?.subscription?.unitsLimit || 10;
    
    // Count total units in assigned or all properties
    const totalUnitsCount = properties.reduce((acc, prop) => {
        // Handle array of units or length field
        const unitsList = prop.units || [];
        return acc + (Array.isArray(unitsList) ? unitsList.length : (parseInt(prop.totalUnits) || 0));
    }, 0);

    const getPlanDisplayName = (id) => {
        switch (id?.toLowerCase()) {
            case 'starter': return 'Starter Plan';
            case 'growth': return 'Growth Plan';
            case 'professional': return 'Professional Plan';
            case 'starter_trial': return 'Starter Trial';
            default: return 'Starter Trial';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
            
            {/* ── Executive Banner Header ── */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-800 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Visual radial light gradients */}
                <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
                
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-inner uppercase select-none shrink-0">
                        {profile?.name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{profile?.name || 'KodiPay Member'}</h1>
                            <span className="px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded text-[9px] font-black uppercase tracking-wider">
                                {profile?.role || 'Staff'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 font-semibold">{profile?.email}</p>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Agency ID: {profile?.agencyId || '—'}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Subscription Active Plan Details Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-md shadow-sm">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <Zap size={18} fill="currentColor" strokeWidth={1} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Plan</p>
                            <p className="text-xs font-black text-amber-400 uppercase tracking-wider">{getPlanDisplayName(activePlanName)}</p>
                            <p className="text-[9px] text-slate-400 font-bold capitalize mt-0.5">{planStatus} Account</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center justify-center gap-2 h-11 px-5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer border border-white/10 shrink-0"
                    >
                        <Edit2 size={13} strokeWidth={2.5} /> Edit Profile
                    </button>
                </div>
            </div>

            {/* ── Executive Billing Allocations Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Properties Limit Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Properties Capacity</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Building2 size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">{properties.length}</span>
                            <span className="text-xs font-bold text-slate-400">/ {propertiesLimit} properties</span>
                        </div>
                        {/* Custom Visual progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, (properties.length / propertiesLimit) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Units Capacity Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Allocation</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Key size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">{totalUnitsCount}</span>
                            <span className="text-xs font-bold text-slate-400">/ {unitsLimit} units</span>
                        </div>
                        {/* Custom Visual progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, (totalUnitsCount / unitsLimit) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* SMS Dispatch Balance Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMS Balance</span>
                        <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                            <MessageSquare size={15} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-sky-600">{smsRemaining.toLocaleString()}</span>
                            <span className="text-xs font-bold text-slate-400">/ {(smsUsage?.monthlyLimit || 2000).toLocaleString()} units</span>
                        </div>
                        {/* Custom Visual progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, (smsRemaining / (smsUsage?.monthlyLimit || 2000)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Visual Grid Details ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Area: Corporate Credentials */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Credential Profile</h3>
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-black uppercase tracking-wider text-[10px]">
                                <CheckCircle2 size={13} strokeWidth={2.5} /> Verified Member
                            </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField icon={<User size={15} />} label="Corporate Name" value={profile?.name} />
                            <InfoField icon={<Phone size={15} />} label="Primary Phone" value={profile?.phone || 'Not Registered'} />
                            <InfoField icon={<Mail size={15} />} label="Corporate Email" value={profile?.email} />
                            <InfoField icon={<Shield size={15} />} label="System Access Role" value={profile?.role} isBadge />
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Administrator Agency Scope</h3>
                                    <p className="mt-1.5 text-xs font-semibold text-slate-500 leading-relaxed">
                                        Your corporate credentials possess full root access to the agency <strong className="text-slate-900">{profile?.agencyId}</strong>. You have permissions to configure properties, subagents, billing plans, and retrieve consolidated financial statements.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">Subagent Manager</span>
                                        <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">Financial Ledgers</span>
                                        <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">System Settings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Area: Sidebar widgets */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Billing Actions Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Billing Quick Actions</h3>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                            Upgrade your property and SMS quotas instantly using our premium STK checkout API.
                        </p>
                        <div className="pt-2">
                            <Link 
                                href="/dashboard/billing"
                                className="w-full py-3.5 bg-slate-950 text-white hover:bg-black rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-900"
                            >
                                Manage billing <ArrowRight size={12} strokeWidth={2.5} />
                            </Link>
                        </div>
                    </div>

                    {/* Assigned Properties (Subagents Only) */}
                    {!isAdmin && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Assigned Portfolio</h3>
                                <span className="text-[9px] font-black bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {assignedProps.length} Properties
                                </span>
                            </div>
                            <div className="p-6">
                                {assignedProps.length > 0 ? (
                                    <div className="space-y-3">
                                        {assignedProps.map(prop => (
                                            <div key={prop.id || prop.propertyId} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-slate-200 hover:bg-white transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:border-slate-300 transition-colors shrink-0">
                                                        <Building2 size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-xs text-slate-900">{prop.propertyName}</p>
                                                        <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 mt-0.5">
                                                            <MapPin size={9} /> {prop.propertyLocation || 'Unspecified'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                                        <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-500 text-xs font-semibold">No assigned properties found on your profile.</p>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Please ask agency administrator to assign your portfolio.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Corporate Activity & Notifications Feed */}
                    {isAdmin && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                <Bell size={16} className="text-rose-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">System Logs</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 flex gap-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={13} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-900">Utility Ledgers Synced</p>
                                        <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">Electricity and water utility usage tiers successfully updated.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <AlertCircle size={13} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-900">Subagent Permissions Updated</p>
                                        <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">Subagent property assignment metrics updated in database cache.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <Modal title="Edit Profile Details" onClose={() => setShowEditModal(false)} maxWidth="max-w-md">
                    <form onSubmit={handleUpdateProfile} className="space-y-5 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Full Name</label>
                            <input
                                required
                                placeholder="Your full name"
                                className="w-full h-10 px-3 rounded border border-[#E2E8F0] outline-none text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#007AFF] focus:ring-1 focus:ring-sky-100"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Phone Number</label>
                            <input
                                required
                                placeholder="07XX XXX XXX"
                                className="w-full h-10 px-3 rounded border border-[#E2E8F0] outline-none text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#007AFF] focus:ring-1 focus:ring-sky-100"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-[#F1F5F9] text-[#64748B] rounded-md text-[13px] font-bold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] h-10 bg-[#007AFF] text-white rounded-md text-[13px] font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

function InfoField({ icon, label, value, isBadge }) {
    return (
        <div className="space-y-1.5 text-left">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{label}</p>
            <div className="flex items-center gap-2.5">
                <div className="text-[#94A3B8]">{icon}</div>
                {isBadge ? (
                    <span className="px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] rounded text-[10px] font-bold uppercase tracking-wider">
                        {value || '—'}
                    </span>
                ) : (
                    <p className="text-xs font-semibold text-[#0F172A]">{value || 'Unspecified'}</p>
                )}
            </div>
        </div>
    );
}

