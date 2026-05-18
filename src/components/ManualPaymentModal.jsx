'use client';

import { useState } from 'react';
import { Modal } from './ui';
import { processManualPayment, formatCurrency, getCurrentMonth } from '@/lib/api';
import { CreditCard, Wallet, Landmark, Banknote, Calendar, FileText, Smartphone, Info, X } from 'lucide-react';

const bankOptions = [
    'Equity Bank',
    'KCB Bank',
    'Absa Bank',
    'Family Bank',
    'Co-operative Bank',
    'NCBA Bank',
    'Standard Chartered',
    'Diamond Trust Bank',
    'Other'
];

export default function ManualPaymentModal({ tenant, status, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMonth: getCurrentMonth(),
        note: '',
        transactionCode: '',
        bankName: '',
        phoneNumber: tenant?.phone || '',
        receiptNumber: '',
        chequeNumber: '',
        chequeDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Basic validation for required fields based on method
        if (form.paymentMethod === 'mpesa_manual' && !form.transactionCode) {
            setError('Transaction code is required for M-Pesa payments');
            return;
        }
        if (form.paymentMethod === 'bank' && (!form.bankName || !form.transactionCode)) {
            setError('Bank name and transaction code are required');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await processManualPayment({
                tenantId: tenant.id,
                ...form,
                amount: parseFloat(form.amount)
            });
            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.error || 'Failed to process payment');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const remaining = status?.remaining || 0;

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold">{tenant.name}</span>
                        <span className="text-slate-400 font-medium">Unit: {tenant.unitCode}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-rose-600 font-black">Total Due: {formatCurrency(tenant.arrears || 0)}</span>
                    </div>
                }
                onClose={onClose}
                maxWidth="max-w-5xl"
            >
                {error && (
                    <div className="mb-3 p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded text-[10px] font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Main Inputs Row */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Amount */}
                        <div className="col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KES</span>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 pl-10 pr-2 py-1.5 text-sm font-bold bg-slate-50/50 focus:ring-1 focus:ring-sky-500 outline-none"
                                    value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        {/* Method Pills */}
                        <div className="col-span-5 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Method</label>
                            <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
                                {[
                                    { id: 'cash', label: 'Cash' },
                                    { id: 'mpesa_manual', label: 'M-Pesa' },
                                    { id: 'bank', label: 'Bank' },
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, paymentMethod: method.id }))}
                                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${form.paymentMethod === method.id
                                                ? 'bg-white text-sky-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Payment Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium outline-none"
                                value={form.paymentDate}
                                onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Month */}
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Allocation Month</label>
                            <input
                                type="month"
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium outline-none"
                                value={form.paymentMonth}
                                onChange={e => setForm(f => ({ ...f, paymentMonth: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Conditional Row (Slim) */}
                    {(form.paymentMethod === 'mpesa_manual' || form.paymentMethod === 'bank') && (
                        <div className="grid grid-cols-3 gap-3 p-2 bg-sky-50/30 rounded-lg border border-sky-100 items-end">
                            {form.paymentMethod === 'mpesa_manual' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-sky-600 ml-1">Trans Code</label>
                                        <input
                                            type="text"
                                            className="w-full rounded border border-sky-200 px-2 py-1 text-xs font-mono uppercase font-bold"
                                            placeholder="RJX..."
                                            value={form.transactionCode}
                                            onChange={e => setForm(f => ({ ...f, transactionCode: e.target.value.toUpperCase() }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-sky-600 ml-1">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full rounded border border-sky-200 px-2 py-1 text-xs"
                                            placeholder="07..."
                                            value={form.phoneNumber}
                                            onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                        />
                                    </div>
                                </>
                            )}

                            {form.paymentMethod === 'bank' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-sky-600 ml-1">Bank</label>
                                        <select
                                            className="w-full rounded border border-sky-200 px-1 py-1 text-xs"
                                            value={form.bankName}
                                            onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select...</option>
                                            {bankOptions.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-sky-600 ml-1">Ref #</label>
                                        <input
                                            type="text"
                                            className="w-full rounded border border-sky-200 px-2 py-1 text-xs"
                                            value={form.transactionCode}
                                            onChange={e => setForm(f => ({ ...f, transactionCode: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowInstructions(true)}
                                className="text-[9px] font-bold text-sky-600 underline text-right pb-1"
                            >
                                Need help with codes?
                            </button>
                        </div>
                    )}

                    {/* Cash Specific Row */}
                    {form.paymentMethod === 'cash' && (
                        <div className="space-y-1 max-w-[200px]">
                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Receipt # (Optional)</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none"
                                placeholder="REC-123"
                                value={form.receiptNumber}
                                onChange={e => setForm(f => ({ ...f, receiptNumber: e.target.value }))}
                            />
                        </div>
                    )}

                    {/* Final Row: Note + Actions */}
                    <div className="flex gap-4 items-center pt-2 border-t border-slate-50">
                        <div className="flex-1 flex items-center gap-2">
                            <FileText size={12} className="text-slate-400" />
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none text-xs outline-none text-slate-600"
                                placeholder="Add a quick note..."
                                value={form.note}
                                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            />
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button type="button" className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all" onClick={onClose}>Cancel</button>
                            <button
                                type="submit"
                                className="px-6 py-1.5 bg-sky-600 text-white rounded-lg text-[11px] font-bold shadow-md shadow-sky-100 hover:bg-sky-500 transition-all disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {showInstructions && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
                                    <Info size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Transaction Instructions</h3>
                            </div>
                            <button onClick={() => setShowInstructions(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Personal Accounts</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    For payments made to personal accounts, append <span className="font-mono font-bold text-sky-600">/personal</span> to the transaction code.
                                    <br /><span className="italic mt-1 block text-[10px]">Example: RJX12345/personal</span>
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Overpayments / Bulk Payments</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    If the transaction amount is more than the balance, include the total amount in parentheses after the code.
                                    <br /><span className="italic mt-1 block text-[10px]">Example: RJX12345(15000)</span>
                                </p>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <h4 className="font-bold text-sm text-amber-800 mb-1">Double Check</h4>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Ensure the transaction code is entered exactly as it appears on the receipt to avoid duplicate entry errors.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowInstructions(false)}
                            className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
