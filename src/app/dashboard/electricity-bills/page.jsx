'use client';

import { useState, useEffect } from 'react';
import { getProperties, getElectricityBills, saveElectricityBills, getTenants, getCurrentMonth, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, EmptyState, MonthPicker } from '@/components/ui';
import { Save, Zap, FileText } from 'lucide-react';

export default function ElectricityBillsPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('');
    const [tenants, setTenants] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        Promise.all([
            getProperties(),
            getTenants()
        ]).then(([propRes, tenantRes]) => {
            const propList = propRes?.data || propRes || [];
            const tenantList = tenantRes?.data || tenantRes || [];
            
            setProperties(propList);
            setTenants(tenantList);
            
            if (propList.length > 0 && !selectedProp) {
                setSelectedProp(propList[0].id);
            }
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    const calculateTieredBill = (units, settings) => {
        const rate1 = parseFloat(settings?.rate1 || 12.23);
        const limit1 = parseFloat(settings?.limit1 || 30);
        const rate2 = parseFloat(settings?.rate2 || 16.45);
        const limit2 = parseFloat(settings?.limit2 || 100);
        const rate3 = parseFloat(settings?.rate3 || 19.08);

        let total = 0;
        let remaining = units;
        
        // Tier 1
        const t1Units = Math.min(remaining, limit1);
        total += t1Units * rate1;
        remaining -= t1Units;
        
        // Tier 2
        if (remaining > 0) {
            const t2Units = Math.min(remaining, limit2 - limit1);
            total += t2Units * rate2;
            remaining -= t2Units;
        }
        
        // Tier 3
        if (remaining > 0) {
            total += remaining * rate3;
        }
        
        return Math.round(total);
    };

    useEffect(() => {
        if (!selectedProp) return;
        
        let active = true;
        setLoading(true);

        getElectricityBills(selectedProp, month).then(billRes => {
            if (!active) return;

            const fetchedBills = billRes?.data?.bills || billRes?.bills || [];
            const activeProp = properties.find(p => p.id === selectedProp);
            const settings = activeProp?.electricitySettings || {};

            const mappedBills = fetchedBills.map(b => {
                const currentVal = b.currentReading;
                const previousReading = b.previousReading || 0;
                const currentReading = (currentVal !== undefined && currentVal !== 0 && currentVal !== '') ? parseFloat(currentVal) : '';
                const consumed = currentReading === '' ? 0 : Math.max(0, currentReading - previousReading);
                const totalBill = currentReading === '' ? 0 : calculateTieredBill(consumed, settings);
                
                // Directly look up tenant by propertyId and unitCode
                const matchedTenant = tenants.find(t => 
                    t.propertyId === selectedProp && 
                    t.unitCode === b.unitId &&
                    (!t.tenantStatus || t.tenantStatus === 'active')
                );

                return {
                    ...b,
                    tenantName: matchedTenant?.name || '',
                    currentReading,
                    unitsConsumed: consumed,
                    totalBill
                };
            });

            setBills(mappedBills);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [selectedProp, month, tenants, properties]);

    const handleReadingChange = (unitId, value) => {
        const activeProp = properties.find(p => p.id === selectedProp);
        const settings = activeProp?.electricitySettings || {};

        setBills(prev => prev.map(b => {
            if (b.unitId !== unitId) return b;
            const currentReading = value === '' ? '' : parseFloat(value);
            const consumed = value === '' ? 0 : Math.max(0, currentReading - b.previousReading);
            const totalBill = value === '' ? 0 : calculateTieredBill(consumed, settings);
            return {
                ...b,
                currentReading,
                unitsConsumed: consumed,
                totalBill
            };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formattedBills = bills.map(b => ({
                unitId: b.unitId,
                unitCode: b.unitCode || b.unitId,
                unitName: b.unitName || b.unitId,
                previousReading: parseFloat(b.previousReading) || 0,
                currentReading: b.currentReading === '' ? parseFloat(b.previousReading || 0) : parseFloat(b.currentReading),
                totalBill: Math.round(b.totalBill || 0)
            }));

            await saveElectricityBills(selectedProp, { month, bills: formattedBills });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Failed to save bills. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingPage />;

    const activeProp = properties.find(p => p.id === selectedProp);
    const settings = activeProp?.electricitySettings || {};
    const displayMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Electricity Bills</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Manage monthly electricity consumption and tiered billing for {displayMonth}</p>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        className="h-10 px-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-colors cursor-pointer"
                        value={selectedProp} 
                        onChange={e => setSelectedProp(e.target.value)}
                    >
                        {properties.map(p => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
                    </select>
                    <MonthPicker value={month} onChange={setMonth} />
                    <button
                        className={`flex items-center gap-2 h-10 px-6 rounded-md text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            saved ? 'bg-[#16A34A] text-white' : 'bg-slate-900 text-white hover:bg-black shadow-md active:scale-95'
                        }`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        ) : saved ? (
                            <>Saved!</>
                        ) : (
                            <><Save size={14} /> Save Bills</>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {bills.length === 0 ? (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-16 text-center shadow-sm">
                        <EmptyState icon="⚡" title="No units found" desc="This property has no configured units." />
                    </div>
                ) : (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <h3 className="text-xs font-bold text-[#0F172A] tracking-wider uppercase flex items-center gap-2">
                                <FileText size={14} className="text-[#64748B]" />
                                Electricity Consumption Ledger
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Unit ID & Tenant</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Previous Reading</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Current Reading</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right">Total Bill (Rounded)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {bills.map((b, i) => {
                                        const previousReading = b.previousReading || 0;
                                        const currentVal = b.currentReading;
                                        const consumed = currentVal === '' ? 0 : Math.max(0, parseFloat(currentVal) - previousReading);
                                        const calculatedBill = Math.round(b.totalBill || 0);

                                        return (
                                            <tr key={i} className="hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#007AFF] transition-colors">
                                                        {b.unitId}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">
                                                        {b.tenantName || 'Vacant'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider tabular-nums">
                                                        {previousReading.toLocaleString()} kWh
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        className="w-32 h-10 px-3 bg-white border border-[#E2E8F0] rounded text-[13px] font-semibold text-[#0F172A] focus:border-[#007AFF] outline-none transition-all placeholder:text-[#94A3B8] tabular-nums"
                                                        placeholder={previousReading.toString()}
                                                        value={b.currentReading}
                                                        onChange={e => handleReadingChange(b.unitId, e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[13px] font-bold text-[#B45309]">
                                                            {formatCurrency(calculatedBill)}
                                                        </span>
                                                        {consumed > 0 && (
                                                            <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
                                                                {consumed.toLocaleString()} kWh used
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
