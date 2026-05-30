'use client';

import { useState, useEffect } from 'react';
import { getProperties, getElectricityBills, saveElectricityBills, getTenants, getCurrentMonth, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, EmptyState, MonthPicker } from '@/components/ui';
import { Save, Zap, FileText, Lock } from 'lucide-react';

function getPrevMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isFutureMonth(ym) {
    return ym > getCurrentMonth();
}

export default function ElectricityBillsPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('');
    const [tenants, setTenants] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isFuture = isFutureMonth(month);
    const prevMonth = getPrevMonth(month);

    const calculateTieredBill = (units, settings) => {
        const rate1 = parseFloat(settings?.rate1 || 12.23);
        const limit1 = parseFloat(settings?.limit1 || 30);
        const rate2 = parseFloat(settings?.rate2 || 16.45);
        const limit2 = parseFloat(settings?.limit2 || 100);
        const rate3 = parseFloat(settings?.rate3 || 19.08);
        let total = 0, remaining = units;
        const t1Units = Math.min(remaining, limit1);
        total += t1Units * rate1; remaining -= t1Units;
        if (remaining > 0) { const t2Units = Math.min(remaining, limit2 - limit1); total += t2Units * rate2; remaining -= t2Units; }
        if (remaining > 0) total += remaining * rate3;
        return Math.round(total);
    };

    useEffect(() => {
        Promise.all([getProperties(), getTenants()]).then(([propRes, tenantRes]) => {
            const propList = propRes?.data || propRes || [];
            const tenantList = tenantRes?.data || tenantRes || [];
            setProperties(propList);
            setTenants(tenantList);
            if (propList.length > 0 && !selectedProp) setSelectedProp(propList[0].id);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedProp) return;
        let active = true;
        setLoading(true);

        const activeProp = properties.find(p => p.id === selectedProp);
        const settings = activeProp?.electricitySettings || {};

        const buildBills = (fetchedBills, prevReadingMap = {}) => {
            return fetchedBills.map(b => {
                const previousReading = isFuture
                    ? (prevReadingMap[b.unitId] ?? b.previousReading ?? 0)
                    : (b.previousReading || 0);

                const currentVal = isFuture ? '' : b.currentReading;
                const currentReading = (currentVal !== undefined && currentVal !== 0 && currentVal !== '') ? parseFloat(currentVal) : '';
                const consumed = currentReading === '' ? 0 : Math.max(0, currentReading - previousReading);
                const totalBill = currentReading === '' ? 0 : calculateTieredBill(consumed, settings);

                const matchedTenant = tenants.find(t =>
                    t.propertyId === selectedProp &&
                    t.unitCode === b.unitId &&
                    (!t.tenantStatus || t.tenantStatus === 'active')
                );
                return { ...b, previousReading, tenantName: matchedTenant?.name || '', currentReading, unitsConsumed: consumed, totalBill };
            });
        };

        if (isFuture) {
            Promise.all([
                getElectricityBills(selectedProp, month),
                getElectricityBills(selectedProp, prevMonth)
            ]).then(([curRes, prevRes]) => {
                if (!active) return;
                const fetchedBills = curRes?.data?.bills || curRes?.bills || [];
                const prevBills = prevRes?.data?.bills || prevRes?.bills || [];
                const prevReadingMap = {};
                prevBills.forEach(pb => {
                    if (pb.currentReading !== undefined && pb.currentReading !== '') {
                        prevReadingMap[pb.unitId] = parseFloat(pb.currentReading) || 0;
                    }
                });
                setBills(buildBills(fetchedBills, prevReadingMap));
            }).catch(console.error).finally(() => { if (active) setLoading(false); });
        } else {
            getElectricityBills(selectedProp, month).then(billRes => {
                if (!active) return;
                setBills(buildBills(billRes?.data?.bills || billRes?.bills || []));
            }).catch(console.error).finally(() => { if (active) setLoading(false); });
        }

        return () => { active = false; };
    }, [selectedProp, month, tenants, properties]);

    const handleReadingChange = (unitId, value) => {
        const activeProp = properties.find(p => p.id === selectedProp);
        const settings = activeProp?.electricitySettings || {};
        setBills(prev => prev.map(b => {
            if (b.unitId !== unitId) return b;
            const currentReading = value === '' ? '' : parseFloat(value);
            const consumed = value === '' ? 0 : Math.max(0, currentReading - b.previousReading);
            const totalBill = value === '' ? 0 : calculateTieredBill(consumed, settings);
            return { ...b, currentReading, unitsConsumed: consumed, totalBill };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const invalidBills = bills.filter(b => b.currentReading !== '' && parseFloat(b.currentReading) < parseFloat(b.previousReading || 0));
            if (invalidBills.length > 0) {
                alert(`Current reading cannot be less than previous reading (Check Unit: ${invalidBills[0].unitCode || invalidBills[0].unitId})`);
                setSaving(false);
                return;
            }

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
    const prevMonthLabel = new Date(prevMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Electricity Bills</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">
                        Manage monthly electricity consumption and tiered billing for {displayMonth}
                        {isFuture && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold normal-case tracking-normal">
                                <Lock size={9} /> Previous readings auto-filled from {prevMonthLabel}
                            </span>
                        )}
                    </p>
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
                        ) : saved ? <>Saved!</> : <><Save size={14} /> Save Bills</>}
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
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                                            Previous Reading {isFuture && <span className="text-amber-500 normal-case">({prevMonthLabel})</span>}
                                        </th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                                            Current Reading {isFuture && <span className="text-blue-500 normal-case">({displayMonth})</span>}
                                        </th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right">Total Bill (Rounded)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {bills.map((b, i) => {
                                        const previousReading = b.previousReading || 0;
                                        const currentVal = b.currentReading;
                                        const isInvalid = currentVal !== '' && parseFloat(currentVal) < previousReading;
                                        const consumed = currentVal === '' ? 0 : Math.max(0, parseFloat(currentVal) - previousReading);
                                        const calculatedBill = Math.round(b.totalBill || 0);

                                        return (
                                            <tr key={i} className="hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-[13px] font-bold text-[#0F172A] group-hover:text-[#007AFF] transition-colors">{b.unitId}</div>
                                                    <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">{b.tenantName || 'Vacant'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isFuture ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="number"
                                                                disabled
                                                                value={previousReading}
                                                                className="w-32 h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[13px] font-semibold text-[#64748B] tabular-nums cursor-not-allowed opacity-70"
                                                            />
                                                            <Lock size={12} className="text-[#94A3B8] shrink-0" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider tabular-nums">
                                                            {previousReading.toLocaleString()} kWh
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <input
                                                            type="number"
                                                            className={`w-32 h-10 px-3 bg-white border rounded text-[13px] font-semibold focus:outline-none transition-all placeholder:text-[#94A3B8] tabular-nums ${isInvalid ? 'border-rose-500 text-rose-600 focus:border-rose-600' : 'border-[#E2E8F0] text-[#0F172A] focus:border-[#007AFF]'}`}
                                                            placeholder={previousReading.toString()}
                                                            value={b.currentReading}
                                                            onChange={e => handleReadingChange(b.unitId, e.target.value)}
                                                        />
                                                        {isInvalid && (
                                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Must be &ge; {previousReading}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[13px] font-bold text-[#B45309]">{formatCurrency(calculatedBill)}</span>
                                                        {consumed > 0 && (
                                                            <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">{consumed.toLocaleString()} kWh used</p>
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
