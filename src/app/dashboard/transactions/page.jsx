'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Landmark, Smartphone, Banknote, FileText, PenTool, CreditCard, Wallet, Calendar, Plus } from 'lucide-react';
import { getTransactions, getCurrentMonth, formatCurrency, formatDate } from '@/lib/api';
import { PageHeader, LoadingPage, Badge, EmptyState, MonthPicker } from '@/components/ui';

/* ─── Payment Method Config ───────────────────────────────────────────────── */
const METHOD_CONFIG = {
    mpesa: { label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    mpesa_manual: { label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    'bank transfer': { label: 'Bank Transfer', icon: Landmark, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    bank: { label: 'Bank Transfer', icon: Landmark, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    cash: { label: 'Cash', icon: Banknote, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    cheque: { label: 'Cheque', icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    manual: { label: 'Manual Entry', icon: PenTool, color: 'text-slate-600 bg-slate-50 border-slate-100' },
    other: { label: 'Other', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
};

function getMethodConfig(rawMethod, bankName) {
    const key = (rawMethod || '').toLowerCase().trim();
    if (key === 'bank') {
        const name = (bankName || 'Bank Transfer').trim();
        return { label: name, icon: Landmark, color: 'text-blue-600 bg-blue-50 border-blue-100' };
    }
    return METHOD_CONFIG[key] || METHOD_CONFIG['other'];
}

/* ─── Wallet Card ─────────────────────────────────────────────────────────── */
function WalletCard({ method, display, total, count, percentage, isTotal }) {
    const config = isTotal
        ? { label: 'Grand Total', icon: Wallet, color: 'text-blue-600 bg-blue-50 border-blue-100' }
        : getMethodConfig(method, display);
    const IconComponent = config.icon;

    return (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2.5 mb-2">
                    <div className={`p-1.5 rounded-md border flex items-center justify-center ${config.color || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                        <IconComponent size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{config.label}</p>
                </div>
                <p className="text-2xl font-semibold text-[#0F172A] tracking-tight">{formatCurrency(total)}</p>
            </div>
            {!isTotal && (
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-3">
                    {count} {count === 1 ? 'payment' : 'payments'} ({Math.round(percentage)}%)
                </p>
            )}
        </div>
    );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function TransactionsPage() {
    const [month, setMonth] = useState(getCurrentMonth());
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getTransactions(month)
            .then(d => {
                const tenants = d?.data?.tenants || d?.report?.tenants || d?.data || d || [];
                const safeTenants = Array.isArray(tenants) ? tenants : [];
                const allTx = safeTenants.flatMap(t => {
                    const payments = Array.isArray(t.payments) ? t.payments : [];
                    return payments.map(p => ({
                        ...p,
                        tenantName: t.tenantName || t.name,
                        unitCode: t.unitCode || t.unitName,
                        propertyName: t.propertyName
                    }));
                });
                allTx.sort((a, b) => new Date(b.paymentDate || b.date || b.timestamp) - new Date(a.paymentDate || a.date || a.timestamp));
                setTransactions(allTx);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month]);

    /* ── Compute wallet totals by payment method ── */
    const wallets = useMemo(() => {
        const map = {};
        let grandTotal = 0;

        transactions.forEach(tx => {
            const rawMethod = (tx.paymentMethod || 'manual').toLowerCase().trim();
            const isBank = rawMethod === 'bank';
            const bankLabel = isBank ? (tx.bankName || 'Bank Transfer').trim() : null;
            const key = isBank ? `bank__${bankLabel}` : rawMethod;

            const amount = Number(tx.amount) || 0;
            if (!map[key]) {
                map[key] = {
                    method: tx.paymentMethod || 'manual',
                    display: isBank ? bankLabel : null,
                    total: 0,
                    count: 0,
                };
            }
            map[key].total += amount;
            map[key].count += 1;
            grandTotal += amount;
        });

        const list = Object.values(map).sort((a, b) => b.total - a.total);
        return { list, grandTotal };
    }, [transactions]);

    const displayMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Transactions</h2>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Full ledger for {displayMonth}</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthPicker value={month} onChange={setMonth} />
                    <Link 
                        href="/dashboard/record-payment" 
                        className="bg-[#007AFF] text-white text-[13px] font-medium h-9 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-100 cursor-pointer"
                    >
                        <Plus size={14} /> Record Payment
                    </Link>
                </div>
            </div>

            <div>
                {loading ? <LoadingPage /> : (
                    <>
                        {/* ── Wallet Dashboard ── */}
                        {transactions.length > 0 && (
                            <div className="mb-8">
                                <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">
                                    Payment Wallets · {displayMonth}
                                </p>

                                {/* Wallet cards grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    {/* Grand total card */}
                                    <WalletCard
                                        isTotal
                                        total={wallets.grandTotal}
                                        count={transactions.length}
                                        percentage={100}
                                    />

                                    {/* Per-method wallet cards */}
                                    {wallets.list.map((w) => (
                                        <WalletCard
                                            key={w.display || w.method}
                                            method={w.method}
                                            display={w.display}
                                            total={w.total}
                                            count={w.count}
                                            percentage={wallets.grandTotal > 0 ? (w.total / wallets.grandTotal) * 100 : 0}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Transactions Table ── */}
                        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                            {transactions.length === 0 ? (
                                <EmptyState icon="💸" title="No transactions" desc="No payments found for the selected month." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Date & Reference</th>
                                                <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Tenant & Unit</th>
                                                <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] text-right">Amount</th>
                                                <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Method</th>
                                                <th className="px-6 py-3.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">Source</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F5F9]">
                                            {transactions.map((tx, i) => {
                                                const config = getMethodConfig(tx.paymentMethod, tx.bankName);
                                                const IconComponent = config.icon;
                                                return (
                                                    <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="text-[13px] font-semibold text-[#0F172A]">{formatDate(tx.paymentDate || tx.date || tx.timestamp)}</p>
                                                            <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mt-0.5">{tx.transactionCode || tx.paymentId || tx.transactionId || '—'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[13px] font-bold text-[#0F172A]">{tx.tenantName}</p>
                                                            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">{tx.unitCode}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-[13px] font-semibold text-[#16A34A] text-right">{formatCurrency(tx.amount)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`p-1 rounded border flex items-center justify-center ${config.color || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                                                                    <IconComponent size={12} />
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                                                                    {tx.paymentMethod?.toLowerCase() === 'bank' && tx.bankName
                                                                        ? tx.bankName
                                                                        : config.label}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                                                                {tx.source || 'Direct'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
