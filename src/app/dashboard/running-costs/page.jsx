'use client';

import { useState, useEffect } from 'react';
import { getProperties, getPropertyById, getRunningCosts, addRunningCost, addRunningCostsBatch, deleteRunningCost, getCurrentMonth, formatCurrency, formatDate } from '@/lib/api';
import { PageHeader, LoadingPage, EmptyState, MonthPicker, Modal, ConfirmModal } from '@/components/ui';
import { Plus, Trash2, Receipt, Building2, Tag, Calendar, DollarSign, X } from 'lucide-react';

const CATEGORIES = ['Maintenance', 'Repairs', 'Security', 'Cleaning', 'Utilities', 'Management', 'Insurance', 'Other'];

const CATEGORY_COLORS = {
    Maintenance: 'bg-sky-50 text-sky-700',
    Repairs: 'bg-orange-50 text-orange-700',
    Security: 'bg-slate-100 text-slate-700',
    Cleaning: 'bg-teal-50 text-teal-700',
    Utilities: 'bg-blue-50 text-blue-700',
    Management: 'bg-indigo-50 text-indigo-700',
    Insurance: 'bg-emerald-50 text-emerald-700',
    Other: 'bg-slate-100 text-slate-500',
};

export default function RunningCostsPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [properties, setProperties] = useState([]);
    const [selectedProp, setSelectedProp] = useState('all');
    const [costs, setCosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [rows, setRows] = useState([]);
    const [propertyUnitsMap, setPropertyUnitsMap] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        getProperties().then(d => {
            const list = d?.data || d || [];
            setProperties(Array.isArray(list) ? list : []);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedProp) return;
        setLoading(true);
        getRunningCosts(selectedProp, month)
            .then(d => {
                const list = d?.data?.costs || d?.costs || d?.data || d;
                setCosts(Array.isArray(list) ? list : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedProp, month]);

    const fetchUnitsForProperty = async (propertyId) => {
        if (!propertyId || propertyUnitsMap[propertyId]) return;
        try {
            const res = await getPropertyById(propertyId);
            const propData = res?.data || res;
            if (propData?.units) {
                setPropertyUnitsMap(prev => ({
                    ...prev,
                    [propertyId]: propData.units
                }));
            }
        } catch (err) {
            console.error('Failed to fetch units for property:', propertyId, err);
        }
    };

    const openAddModal = () => {
        const initialPropId = properties[0]?.id || '';
        setRows([
            {
                propertyId: initialPropId,
                unitId: 'general',
                feeName: '',
                category: 'Maintenance',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            }
        ]);
        if (initialPropId) {
            fetchUnitsForProperty(initialPropId);
        }
        setShowModal(true);
    };

    const handleUpdateRow = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        
        if (field === 'propertyId') {
            newRows[index].unitId = 'general';
            fetchUnitsForProperty(value);
        }
        
        setRows(newRows);
    };

    const handleAddRow = () => {
        const initialPropId = properties[0]?.id || '';
        setRows([
            ...rows,
            {
                propertyId: initialPropId,
                unitId: 'general',
                feeName: '',
                category: 'Maintenance',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            }
        ]);
        if (initialPropId) {
            fetchUnitsForProperty(initialPropId);
        }
    };

    const handleRemoveRow = (index) => {
        if (rows.length === 1) return;
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleSubmitBatch = async () => {
        const validRows = rows.filter(r => r.propertyId && r.feeName && r.amount && parseFloat(r.amount) > 0);
        if (validRows.length === 0) {
            alert('Please fill out at least one valid expense row with Description and Amount > 0.');
            return;
        }
        
        setSubmitting(true);
        try {
            const expensesToPost = validRows.map(r => {
                const units = propertyUnitsMap[r.propertyId] || [];
                const selectedUnitObj = units.find(u => u.unitId === r.unitId);
                
                return {
                    propertyId: r.propertyId,
                    unitId: r.unitId === 'general' ? null : r.unitId,
                    unitCode: r.unitId === 'general' ? null : (selectedUnitObj?.unitName || selectedUnitObj?.unitId),
                    unitName: r.unitId === 'general' ? null : (selectedUnitObj?.unitName || selectedUnitObj?.unitId),
                    feeName: r.feeName,
                    category: r.category,
                    amount: parseFloat(r.amount),
                    date: r.date,
                    month
                };
            });
            
            await addRunningCostsBatch({ expenses: expensesToPost });
            setShowModal(false);
            
            const d = await getRunningCosts(selectedProp, month);
            setCosts(d?.data?.costs || d?.costs || []);
        } catch (e) {
            console.error(e);
            alert('Failed to save expenses.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id, feeName) => {
        setDeleteConfirm({
            title: 'Delete Running Cost',
            message: `Are you sure you want to delete "${feeName}"? This cannot be undone.`,
            confirmText: 'Yes, Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteRunningCost(id);
                    setCosts(prev => prev.filter(c => c.id !== id));
                    setDeleteConfirm(null);
                } catch { alert('Failed to delete.'); setDeleteConfirm(null); }
            }
        });
    };

    const total = costs.reduce((s, c) => s + (c.amount || 0), 0);
    const getPropertyName = (id) => properties.find(p => p.id === id)?.propertyName || '—';

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Running Costs</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Operational expenses · {month}</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#007AFF] transition-colors"
                        value={selectedProp}
                        onChange={e => setSelectedProp(e.target.value)}
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
                    </select>
                    <MonthPicker value={month} onChange={setMonth} />
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 h-9 px-4 bg-[#007AFF] text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={14} /> Add Cost
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* KPI Card */}
                <div className="bg-[#0F172A] rounded-lg p-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1.5">Total Operational Expenses</p>
                        <p className="text-3xl font-semibold text-white tracking-tight leading-none">{formatCurrency(total)}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-[11px] font-medium text-white/50 bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                {costs.length} item{costs.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-[11px] font-medium text-white/50 bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                {month}
                            </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center">
                        <Receipt size={24} className="text-white/60" />
                    </div>
                </div>

                {/* Table */}
                {loading ? <LoadingPage /> : (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                        {costs.length === 0 ? (
                            <div className="p-12">
                                <EmptyState icon="🏗️" title="No running costs" desc="Add operational expenses for this property and month." />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                            {['Description', 'Property', 'Category', 'Date', 'Amount', ''].map(h => (
                                                <th key={h} className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F5F9]">
                                        {costs.map((c, i) => (
                                            <tr key={c.id || i} className="hover:bg-[#F8FAFC] transition-colors group">
                                                <td className="px-6 py-4 text-[13px] font-medium text-[#0F172A]">{c.feeName || c.name}</td>
                                                <td className="px-6 py-4 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">{getPropertyName(c.propertyId)}{(c.unitId || c.unitName) ? ` · ${c.unitId || c.unitName}` : ''}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-widest ${CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Other}`}>
                                                        {c.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[13px] text-[#64748B] tabular-nums">{formatDate(c.date)}</td>
                                                <td className="px-6 py-4 text-[13px] font-semibold text-[#0F172A]">{formatCurrency(c.amount)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(c.id, c.feeName || c.name)}
                                                        className="p-1.5 rounded text-[#94A3B8] hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            </div>

            {showModal && (
                <Modal title="Add Operational Expenses" onClose={() => setShowModal(false)} maxWidth="max-w-7xl">
                    <div className="space-y-6 py-2">
                        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[220px]">Property</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[220px]">Unit</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[160px]">Category</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[140px]">Amount (KES)</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-[150px]">Date</th>
                                        <th className="px-4 py-3 w-[45px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9] bg-white">
                                    {rows.map((row, index) => {
                                        const units = propertyUnitsMap[row.propertyId] || [];
                                        return (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Property */}
                                                <td className="px-3 py-2">
                                                    <select
                                                        className="w-full h-9 px-2 rounded border border-[#E2E8F0] outline-none text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF]"
                                                        value={row.propertyId}
                                                        onChange={e => handleUpdateRow(index, 'propertyId', e.target.value)}
                                                    >
                                                        {properties.map(p => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
                                                    </select>
                                                </td>

                                                {/* Unit */}
                                                <td className="px-3 py-2">
                                                    <select
                                                        className="w-full h-9 px-2 rounded border border-[#E2E8F0] outline-none text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF]"
                                                        value={row.unitId}
                                                        onChange={e => handleUpdateRow(index, 'unitId', e.target.value)}
                                                    >
                                                        <option value="general">🏢 Portfolio / General</option>
                                                        {units.map(u => (
                                                            <option key={u.unitId} value={u.unitId}>
                                                                🚪 {u.unitId} {u.tenantName ? `(${u.tenantName})` : '(Vacant)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Description */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        className="w-full h-9 px-3 rounded border border-[#E2E8F0] outline-none text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#007AFF]"
                                                        placeholder="e.g. Generator repair"
                                                        value={row.feeName}
                                                        onChange={e => handleUpdateRow(index, 'feeName', e.target.value)}
                                                    />
                                                </td>

                                                {/* Category */}
                                                <td className="px-3 py-2">
                                                    <select
                                                        className="w-full h-9 px-2 rounded border border-[#E2E8F0] outline-none text-[13px] text-[#0F172A] focus:border-[#007AFF]"
                                                        value={row.category}
                                                        onChange={e => handleUpdateRow(index, 'category', e.target.value)}
                                                    >
                                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                                    </select>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-3 py-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">KES</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full h-9 pl-10 pr-2 rounded border border-[#E2E8F0] outline-none text-[13px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#007AFF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="0"
                                                            value={row.amount}
                                                            onChange={e => handleUpdateRow(index, 'amount', e.target.value)}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="date"
                                                        className="w-full h-9 px-2 rounded border border-[#E2E8F0] outline-none text-[12px] text-[#0F172A] focus:border-[#007AFF]"
                                                        value={row.date}
                                                        onChange={e => handleUpdateRow(index, 'date', e.target.value)}
                                                    />
                                                </td>

                                                {/* Action */}
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(index)}
                                                        disabled={rows.length === 1}
                                                        className="p-1 rounded text-[#94A3B8] hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#94A3B8]"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Row and Actions Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="flex items-center gap-1.5 px-4 h-9 border border-[#007AFF] text-[#007AFF] rounded-md text-[13px] font-bold hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={14} /> Add Row
                            </button>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="px-5 h-9 bg-[#F1F5F9] text-[#64748B] rounded-md text-[13px] font-bold hover:bg-[#E2E8F0] transition-colors"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="px-6 h-9 bg-[#007AFF] text-white rounded-md text-[13px] font-bold hover:bg-blue-600 shadow-md shadow-blue-100 transition-colors disabled:opacity-50"
                                    onClick={handleSubmitBatch}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Posting Expenses...' : `Post ${rows.length} Expense${rows.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteConfirm && <ConfirmModal {...deleteConfirm} onCancel={() => setDeleteConfirm(null)} />}
        </>
    );
}
