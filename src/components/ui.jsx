'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export function Tooltip({ text, children }) {
    const [show, setShow] = useState(false);
    let touchTimer = null;

    const handleTouchStart = () => {
        touchTimer = setTimeout(() => setShow(true), 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (touchTimer) clearTimeout(touchTimer);
        setShow(false);
    };

    return (
        <div
            className="relative inline-flex items-center justify-center"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {children}
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] w-max max-w-[250px] rounded-xl bg-[var(--color-text-primary)] text-[var(--color-primary-foreground)] text-xs leading-relaxed px-3 py-2 shadow-xl pointer-events-none text-center tooltip-content">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[var(--color-text-primary)]" />
                </div>
            )}
        </div>
    );
}

export function HelpButton() {
    return (
        <Link href="/docs/faq" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full shadow-lg hover:shadow-xl hover:bg-[var(--color-primary-dark)] transition-all hover:-translate-y-1 group">
            <HelpCircle size={26} />
            <span className="absolute right-full mr-3 whitespace-nowrap bg-[var(--color-text-primary)] text-[var(--color-primary-foreground)] text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Help & FAQ
            </span>
        </Link>
    );
}

export function StatCard({ icon, iconBg, value, label, trend }) {
    return (
        <div className="stat-card">
            <div className="stat-card__icon" style={{ background: iconBg || 'var(--color-surface-hover)' }}>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__label">{label}</div>
            {trend && (
                <div style={{ marginTop: 8, fontSize: 'var(--text-tiny)', color: trend.positive ? 'var(--color-success-dark)' : 'var(--color-danger-dark)', fontWeight: 600 }}>
                    {trend.positive ? '↑' : '↓'} {trend.label}
                </div>
            )}
        </div>
    );
}

export function Badge({ status }) {
    const s = (status || '').toLowerCase();
    const cls = s === 'paid' ? 'badge-paid' : s === 'partial' ? 'badge-partial' : 'badge-unpaid';
    return <span className={`badge ${cls}`}>{status || 'Unpaid'}</span>;
}

export function Spinner({ size = 20 }) {
    return <Loader2 size={size} className="animate-spin text-[var(--color-primary)]" />;
}

export function LoadingPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Spinner size={32} />
            <span className="text-[var(--color-text-secondary)] font-medium animate-pulse">Loading dashboard...</span>
        </div>
    );
}

export function EmptyState({ icon = '📂', title, desc, actionText, onAction }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-5xl mb-5 bg-[var(--color-surface-hover)] w-24 h-24 flex items-center justify-center rounded-full border-4 border-[var(--color-surface)] shadow-sm">
                {icon}
            </div>
            <div className="text-slate-900 font-bold text-lg mb-2">{title}</div>
            {desc && <div className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">{desc}</div>}
            {actionText && onAction && (
                <button onClick={onAction} className="btn btn-primary">
                    {actionText}
                </button>
            )}
        </div>
    );
}

export function ProgressBar({ value, max, color }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="progress-bar">
            <div
                className="progress-bar__fill"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    );
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
    const content = (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`modal ${maxWidth}`}>
                <div className="modal-header py-3 px-4">
                    <div className="flex-1">
                        <h2 className="modal-title text-base">{title}</h2>
                    </div>
                    <button
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                        onClick={onClose}
                    ><X size={18} /></button>
                </div>
                <div className="modal-body p-4">{children}</div>
            </div>
        </div>
    );
    
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (mounted && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return null;
}

export function MonthPicker({ value, onChange }) {
    const options = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        options.push({ value: val, label });
    }
    return (
        <select className="form-select w-auto min-w-[200px]" value={value} onChange={e => onChange(e.target.value)}>
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}

export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="page-header">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
                {children && <div className="flex gap-3 items-center flex-wrap">{children}</div>}
            </div>
        </div>
    );
}

export function Toast({ message, type = 'success', onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bg = type === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]';

    const content = (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl text-white font-bold shadow-2xl animate-slide-up ${bg}`}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <span className="text-sm">{message}</span>
        </div>
    );

    if (mounted && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return null;
}

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) {
    const isDanger = type === 'danger';

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white border border-[#E2E8F0]/80 w-full max-w-[420px] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative">
                
                {/* Decorative Top Line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] ${isDanger ? 'bg-rose-500' : 'bg-[#0F172A]'}`} />
                
                <div className="p-8">
                    <div className="flex flex-col items-center text-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                            isDanger 
                                ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' 
                                : 'bg-[#F8FAFC] text-[#0F172A] ring-1 ring-[#E2E8F0]'
                        }`}>
                            {isDanger ? <X size={28} strokeWidth={2.5} /> : <CheckCircle2 size={28} strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight">{title}</h3>
                            <p className="text-[13px] font-medium text-[#64748B] mt-2.5 leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-[#F8FAFC]/60 flex items-center justify-center gap-3 border-t border-[#F1F5F9]">
                    {cancelText && (
                        <button
                            onClick={onCancel}
                            className="flex-1 h-11 px-5 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl text-[13px] font-bold tracking-wide hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all cursor-pointer shadow-sm focus:outline-none"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className={`flex-1 h-11 px-6 text-white rounded-xl text-[13px] font-bold tracking-wide transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none ${
                                isDanger
                                    ? 'bg-[#E11D48] hover:bg-[#BE123C] shadow-rose-200'
                                    : 'bg-[#0F172A] hover:bg-[#1E293B] shadow-slate-200'
                            }`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (mounted && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return null;
}
