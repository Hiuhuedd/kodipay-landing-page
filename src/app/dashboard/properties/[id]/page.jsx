'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPropertyById, updateUnit, updateProperty, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, Modal } from '@/components/ui';
import { Settings, User, Droplets, Zap, Building2, MapPin, Save, X, Plus, UserPlus, CreditCard } from 'lucide-react';
import OnboardTenantModal from '@/components/OnboardTenantModal';
import ManualPaymentModal from '@/components/ManualPaymentModal';

export default function PropertyDetailPage() {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingUnit, setEditingUnit] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [onboardUnit, setOnboardUnit] = useState(null);
    const [form, setForm] = useState({ rentAmount: '', garbageFee: '', waterBill: '', waterMeterReading: '', depositAmount: '' });
    const [settingsForm, setSettingsForm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [payTenant, setPayTenant] = useState(null);
    const [clients, setClients] = useState([]);

    const load = useCallback(() => {
        getPropertyById(id)
            .then(d => {
                const data = d?.data || d;
                setProperty(data);
                // Initialize settings form
                setSettingsForm({
                    propertyName: data.propertyName || '',
                    address: data.address || '',
                    agencyCommission: data.agencyCommission || 8,
                    owner: {
                        id: data.ownerId || '',
                        name: data.owner?.name || ''
                    },
                    caretaker: {
                        name: data.caretaker?.name || '',
                        phone: data.caretaker?.phone || ''
                    },
                    waterMeterSettings: {
                        meterType: data.waterMeterSettings?.meterType || 'single',
                        costPerUnit: data.waterMeterSettings?.costPerUnit || 95,
                        fixedWaterBill: data.waterMeterSettings?.fixedWaterBill || 0
                    },
                    electricitySettings: {
                        rate1: data.electricitySettings?.rate1 || 12.23,
                        limit1: data.electricitySettings?.limit1 || 30,
                        rate2: data.electricitySettings?.rate2 || 16.45,
                        limit2: data.electricitySettings?.limit2 || 100,
                        rate3: data.electricitySettings?.rate3 || 19.08
                    }
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (showSettingsModal) {
            import('@/lib/api').then(({ fetchAPI }) => {
                fetchAPI('/clients')
                    .then(res => setClients(res.data || []))
                    .catch(console.error);
            });
        }
    }, [showSettingsModal]);

    const handleEditClick = (unit) => {
        setEditingUnit(unit);
        setForm({
            unitName: unit.unitId || unit.unitCode || unit.unitName || '',
            rentAmount: unit.rentAmount || '',
            garbageFee: unit.utilityFees?.garbageFee || '',
            waterBill: unit.utilityFees?.waterBill || '',
            waterMeterReading: unit.waterMeterReading || '',
            depositAmount: unit.depositAmount || ''
        });
    };

    const handleUpdate = async () => {
        if (!editingUnit) return;
        setSubmitting(true);
        try {
            const isIndividual = property.waterMeterSettings?.meterType === 'individual';
            const payload = {
                unitName: form.unitName,
                rentAmount: parseFloat(form.rentAmount) || 0,
                utilityFees: {
                    garbageFee: parseFloat(form.garbageFee) || 0,
                    waterBill: isIndividual ? (parseFloat(form.waterMeterReading || 0) * (property.waterMeterSettings?.costPerUnit || 0)) : (parseFloat(form.waterBill) || 0)
                },
                depositAmount: parseFloat(form.depositAmount) || 0
            };

            if (isIndividual) {
                payload.waterMeterReading = parseFloat(form.waterMeterReading) || 0;
            }

            await updateUnit(id, editingUnit.unitId || editingUnit.unitCode, payload);
            setEditingUnit(null);
            load();
        } catch (e) {
            alert('Error updating unit');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettingsUpdate = async () => {
        setSubmitting(true);
        try {
            // Ensure we include units in the update payload as the service expects them
            const payload = {
                ...settingsForm,
                units: property.units || []
            };
            await updateProperty(id, payload);
            setShowSettingsModal(false);
            load();
        } catch (e) {
            alert('Error updating property settings');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingPage />;
    if (!property) return <div className="section"><div className="card card-body">Property not found.</div></div>;

    const units = property.units || [];
    const isWaterIndividual = property.waterMeterSettings?.meterType === 'individual';

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">{property.propertyName}</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">{property.address || property.location || 'No address'}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard/properties" className="h-9 px-4 bg-white border border-[#E2E8F0] text-[#64748B] rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-colors flex items-center gap-2">
                        <X size={14} /> Back
                    </Link>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="h-9 px-4 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-md text-xs font-medium hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                    >
                        <Settings size={14} className="text-[#94A3B8]" /> Settings
                    </button>
                    <Link href={`/dashboard/water-bills?property=${id}`} className="h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Droplets size={14} /> Water Bills
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                {/* ── Summary Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                                <Building2 size={16} />
                            </div>
                            <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest">Total Inventory</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#0F172A] leading-none">{property.propertyUnitsTotal || units.length}</h3>
                        <p className="text-[11px] text-[#94A3B8] mt-1.5 uppercase tracking-wide">Configured Units</p>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                                <User size={16} />
                            </div>
                            <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest">Occupancy</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#0F172A] leading-none">{property.propertyOccupiedUnits || units.filter(u => u.tenantId).length}</h3>
                        <p className="text-[11px] text-[#16A34A] font-medium mt-1.5 uppercase tracking-wide">Active Tenants</p>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
                                <MapPin size={16} />
                            </div>
                            <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest">Availability</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#0F172A] leading-none">{property.propertyVacantUnits || units.filter(u => !u.tenantId).length}</h3>
                        <p className="text-[11px] text-[#DC2626] font-medium mt-1.5 uppercase tracking-wide">Vacant Units</p>
                    </div>

                    <div className="bg-[#0F172A] p-5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/70">
                                <Zap size={16} />
                            </div>
                            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Revenue</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-white leading-none">{formatCurrency(property.expectedMonthlyRevenue || 0)}</h3>
                        <p className="text-[11px] text-white/40 mt-1.5 uppercase tracking-wide">Estimated Monthly</p>
                    </div>
                </div>

                {/* ── Configuration Cards ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-lg border border-[#E2E8F0]">
                        <div className="flex items-center gap-2 mb-5">
                            <User size={14} className="text-[#94A3B8]" />
                            <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Management</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-widest mb-1">Caretaker</p>
                                <p className="text-[13px] font-semibold text-[#0F172A]">{property.caretaker?.name || 'Not assigned'}</p>
                                {property.caretaker?.phone && <p className="text-[11px] text-[#007AFF] font-medium mt-0.5">{property.caretaker.phone}</p>}
                            </div>
                            <div className="pt-4 border-t border-[#F1F5F9]">
                                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-widest mb-1">Agency Commission</p>
                                <p className="text-xl font-semibold text-[#0F172A]">{property.agencyCommission || 8}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-[#E2E8F0]">
                        <div className="flex items-center gap-2 mb-5">
                            <Droplets size={14} className="text-[#94A3B8]" />
                            <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Water Billing</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-widest mb-1">Billing Mode</p>
                                <p className="text-[13px] font-semibold text-[#0F172A]">{isWaterIndividual ? 'Individual Meter' : 'Fixed Monthly'}</p>
                            </div>
                            <div className="pt-4 border-t border-[#F1F5F9]">
                                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-widest mb-1">{isWaterIndividual ? 'Rate per Unit' : 'Flat Fee'}</p>
                                <p className="text-xl font-semibold text-[#0F172A]">KES {isWaterIndividual ? (property.waterMeterSettings?.costPerUnit || 95) : (property.waterMeterSettings?.fixedWaterBill || 0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-[#E2E8F0]">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap size={14} className="text-[#94A3B8]" />
                            <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Electricity Tiers</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-[#F8FAFC] p-2 rounded text-center border border-[#E2E8F0]">
                                <p className="text-[9px] font-medium text-[#94A3B8] uppercase tracking-widest mb-1">Tier 1</p>
                                <p className="text-[13px] font-semibold text-[#0F172A]">{property.electricitySettings?.rate1 || 12.23}</p>
                            </div>
                            <div className="bg-[#F8FAFC] p-2 rounded text-center border border-[#E2E8F0]">
                                <p className="text-[9px] font-medium text-[#94A3B8] uppercase tracking-widest mb-1">Tier 2</p>
                                <p className="text-[13px] font-semibold text-[#0F172A]">{property.electricitySettings?.rate2 || 16.45}</p>
                            </div>
                            <div className="bg-[#F8FAFC] p-2 rounded text-center border border-[#E2E8F0]">
                                <p className="text-[9px] font-medium text-[#94A3B8] uppercase tracking-widest mb-1">Tier 3</p>
                                <p className="text-[13px] font-semibold text-[#0F172A]">{property.electricitySettings?.rate3 || 19.08}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#94A3B8] italic">Automated tiered consumption billing active.</p>
                    </div>
                </div>

                {/* ── Units Table ── */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-[#0F172A]">Property Inventory</h3>
                            <p className="text-[11px] text-[#64748B] uppercase tracking-widest mt-0.5">{units.length} Total Units</p>
                        </div>
                        <button
                            onClick={() => setShowOnboardModal(true)}
                            className="flex items-center gap-2 h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                        >
                            <UserPlus size={14} /> Add Tenant
                        </button>
                    </div>

                    {units.length === 0 ? (
                        <div className="py-20 text-center">
                            <Building2 size={40} className="mx-auto text-[#CBD5E1] mb-4" />
                            <p className="text-sm font-medium text-[#64748B]">No units have been configured.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Unit</th>
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Tenant</th>
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Rent</th>
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Utilities</th>
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide">Status</th>
                                        <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {units.map((u, i) => (
                                        <tr key={i} className="hover:bg-[#F8FAFC] transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] font-semibold text-[#0F172A]">{u.unitId || u.unitCode || u.unitName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.tenantName ? (
                                                    <Link href={`/dashboard/tenants/${u.tenantId}`} className="block">
                                                        <p className="text-[13px] font-medium text-[#0F172A] hover:text-[#007AFF] transition-colors">{u.tenantName}</p>
                                                        <p className="text-[10px] text-[#64748B] uppercase tracking-widest mt-0.5 font-medium">Active Lease</p>
                                                    </Link>
                                                ) : (
                                                    <span className="text-[13px] text-[#94A3B8] italic font-medium">Vacant</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] font-semibold text-[#0F172A]">{formatCurrency(u.rentAmount)}</p>
                                                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest mt-0.5">Base Rate</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-medium text-[#94A3B8] w-12 uppercase">Garbage</span>
                                                        <span className="text-[11px] font-medium text-[#0F172A]">{formatCurrency(u.utilityFees?.garbageFee)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-medium text-[#94A3B8] w-12 uppercase">Water</span>
                                                        <span className="text-[11px] font-medium text-[#0F172A]">{formatCurrency(u.utilityFees?.waterBill)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge status={u.tenantId ? 'Occupied' : 'Vacant'} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {u.tenantId && (
                                                        <button
                                                            onClick={() => setPayTenant({
                                                                id: u.tenantId,
                                                                name: u.tenantName,
                                                                unitCode: u.unitId || u.unitCode || u.unitName,
                                                                phone: u.tenantPhone || ''
                                                            })}
                                                            className="h-8 px-3 bg-white border border-[#E2E8F0] text-[#64748B] rounded text-[11px] font-medium hover:bg-[#F8FAFC] hover:text-[#007AFF] transition-all flex items-center gap-1.5"
                                                        >
                                                            <CreditCard size={12} /> Pay
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditClick(u)}
                                                        className="h-8 px-3 bg-[#F1F5F9] text-[#64748B] rounded text-[11px] font-medium hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            </div> {/* End of animated page wrapper */}

            {editingUnit && (
                <Modal title={`Edit Unit: ${editingUnit.unitId || editingUnit.unitCode || editingUnit.unitName}`} onClose={() => setEditingUnit(null)}>
                    <div className="space-y-5 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Unit No / ID</label>
                            <input type="text" className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]" value={form.unitName} onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Monthly Rent (KES)</label>
                            <input type="number" className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]" value={form.rentAmount} onChange={e => setForm(f => ({ ...f, rentAmount: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Garbage Fee</label>
                                <input type="number" className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]" value={form.garbageFee} onChange={e => setForm(f => ({ ...f, garbageFee: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
                                    {isWaterIndividual ? 'Meter Reading' : 'Water Bill'}
                                </label>
                                <input type="number" className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]" value={isWaterIndividual ? form.waterMeterReading : form.waterBill} onChange={e => setForm(f => ({ ...f, [isWaterIndividual ? 'waterMeterReading' : 'waterBill']: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Deposit Amount</label>
                            <input type="number" className="w-full h-10 px-4 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 pt-3">
                            <button className="flex-1 h-11 bg-[#F1F5F9] text-[#64748B] rounded-md text-[13px] font-medium hover:bg-[#E2E8F0]" onClick={() => setEditingUnit(null)}>Cancel</button>
                            <button className="flex-[2] h-11 bg-[#0F172A] text-white rounded-md text-[13px] font-medium hover:bg-black transition-colors" onClick={handleUpdate} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Unit Changes'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Property Settings Modal */}
            {showSettingsModal && settingsForm && (
                <Modal title="Property Configuration" onClose={() => setShowSettingsModal(false)} maxWidth="max-w-6xl">
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3 mb-2">
                                    <Building2 size={14} className="text-[#94A3B8]" />
                                    <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Basic Information</h4>
                                </div>
                                <div className="space-y-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Property Name</label>
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.propertyName}
                                            onChange={e => setSettingsForm({ ...settingsForm, propertyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Address / Location</label>
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.address}
                                            onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Management */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3 mb-2">
                                    <User size={14} className="text-[#94A3B8]" />
                                    <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Management</h4>
                                </div>
                                <div className="space-y-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Property Owner / Landlord Link</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.owner?.id || ''}
                                            onChange={e => {
                                                const selectedId = e.target.value;
                                                if (!selectedId) {
                                                    setSettingsForm({ ...settingsForm, owner: { id: '', name: '' } });
                                                } else {
                                                    const client = clients.find(c => c.id === selectedId);
                                                    if (client) {
                                                        setSettingsForm({ 
                                                            ...settingsForm, 
                                                            owner: { id: client.id, name: client.name } 
                                                        });
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">-- No landlord linked --</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Caretaker Name</label>
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.caretaker.name}
                                            onChange={e => setSettingsForm({ ...settingsForm, caretaker: { ...settingsForm.caretaker, name: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.caretaker.phone}
                                            onChange={e => setSettingsForm({ ...settingsForm, caretaker: { ...settingsForm.caretaker, phone: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Agency Commission (%)</label>
                                        <input
                                            type="number"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.agencyCommission}
                                            onChange={e => setSettingsForm({ ...settingsForm, agencyCommission: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Water Billing */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3 mb-2">
                                    <Droplets size={14} className="text-[#94A3B8]" />
                                    <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Water Billing</h4>
                                </div>
                                <div className="space-y-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Billing Type</label>
                                        <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-md w-full">
                                            <button
                                                type="button"
                                                onClick={() => setSettingsForm({ ...settingsForm, waterMeterSettings: { ...settingsForm.waterMeterSettings, meterType: 'single' } })}
                                                className={`flex-1 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${settingsForm.waterMeterSettings.meterType === 'single' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'}`}
                                            >
                                                Fixed
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSettingsForm({ ...settingsForm, waterMeterSettings: { ...settingsForm.waterMeterSettings, meterType: 'individual' } })}
                                                className={`flex-1 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${settingsForm.waterMeterSettings.meterType === 'individual' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'}`}
                                            >
                                                Metered
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                                            {settingsForm.waterMeterSettings.meterType === 'individual' ? 'Rate per Unit (KES)' : 'Fixed Monthly Fee (KES)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                                            value={settingsForm.waterMeterSettings.meterType === 'individual' ? settingsForm.waterMeterSettings.costPerUnit : settingsForm.waterMeterSettings.fixedWaterBill}
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (settingsForm.waterMeterSettings.meterType === 'individual') {
                                                    setSettingsForm({ ...settingsForm, waterMeterSettings: { ...settingsForm.waterMeterSettings, costPerUnit: val } });
                                                } else {
                                                    setSettingsForm({ ...settingsForm, waterMeterSettings: { ...settingsForm.waterMeterSettings, fixedWaterBill: val } });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Electricity */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3 mb-2">
                                    <Zap size={14} className="text-[#94A3B8]" />
                                    <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Electricity Tiers</h4>
                                </div>
                                <div className="space-y-3.5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">T1 Rate</label>
                                            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#0F172A]" value={settingsForm.electricitySettings.rate1} onChange={e => setSettingsForm({ ...settingsForm, electricitySettings: { ...settingsForm.electricitySettings, rate1: parseFloat(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">T1 Limit</label>
                                            <input type="number" className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#0F172A]" value={settingsForm.electricitySettings.limit1} onChange={e => setSettingsForm({ ...settingsForm, electricitySettings: { ...settingsForm.electricitySettings, limit1: parseFloat(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">T2 Rate</label>
                                            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#0F172A]" value={settingsForm.electricitySettings.rate2} onChange={e => setSettingsForm({ ...settingsForm, electricitySettings: { ...settingsForm.electricitySettings, rate2: parseFloat(e.target.value) || 0 } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">T2 Limit</label>
                                            <input type="number" className="w-full h-10 px-3 rounded-md bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#0F172A]" value={settingsForm.electricitySettings.limit2} onChange={e => setSettingsForm({ ...settingsForm, electricitySettings: { ...settingsForm.electricitySettings, limit2: parseFloat(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-[#F1F5F9] mt-6">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="flex-1 h-11 bg-[#F1F5F9] text-[#64748B] rounded-md text-[13px] font-medium hover:bg-[#E2E8F0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSettingsUpdate}
                                disabled={submitting}
                                className="flex-[2] h-11 bg-[#0F172A] text-white rounded-md text-[13px] font-medium hover:bg-black transition-colors"
                            >
                                {submitting ? 'Saving Configuration...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Onboard Tenant Modal */}
            {showOnboardModal && (
                <OnboardTenantModal
                    propertyId={id}
                    unitId={onboardUnit}
                    onClose={() => {
                        setShowOnboardModal(false);
                        setOnboardUnit(null);
                    }}
                    onSuccess={load}
                />
            )}
            {/* Manual Payment Modal */}
            {payTenant && (
                <ManualPaymentModal
                    tenant={payTenant}
                    onClose={() => setPayTenant(null)}
                    onSuccess={load}
                />
            )}
        </>
    );
}
