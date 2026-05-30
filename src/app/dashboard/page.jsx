'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getStats, getMonthlyReport, getRunningCosts, getProperties, getSubagents, getStaffPerformance, getSmsUsage,
    formatCurrency, getCurrentMonth, formatDate
} from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { MonthPicker, LoadingPage } from '@/components/ui';
import { Info, ArrowRight, RefreshCw, Bell, CreditCard, Users, ChevronDown, MessageSquare, Calendar, TrendingUp, Plus, PieChart, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Swahili Tooltip ─────────────────────────────────────────── */
function Tip({ text }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <Info size={12} className="text-slate-300 hover:text-[var(--color-primary)] cursor-help transition-colors" />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-[12px] leading-relaxed px-4 py-3 shadow-2xl pointer-events-none text-center animate-fade-in">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95" />
                </div>
            )}
        </span>
    );
}



/* ─── Main ────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const router = useRouter();
    const [month, setMonth] = useState(getCurrentMonth());
    const [stats, setStats] = useState(null);
    const [report, setReport] = useState(null);
    const [costs, setCosts] = useState([]);
    const [smsUsage, setSmsUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState('income'); // 'income' | 'expenses'
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date(month + '-01').getFullYear() || new Date().getFullYear());

    // Subagent filtering
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [subagents, setSubagents] = useState([]);
    const [selectedSubagent, setSelectedSubagent] = useState(null);
    const [showSubagentSelect, setShowSubagentSelect] = useState(false);
    const [staffPerformance, setStaffPerformance] = useState([]);

    // Strict Auth Redirection Shield: If authentication has finished loading and no active user session exists, push to landing page
    useEffect(() => {
        if (!authLoading && !user) {
            console.warn('Unauthorized access: No active user session. Redirecting to home...');
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchAll = useCallback(async (m, silent = false, subagent = null) => {
        if (silent) setRefreshing(true); else setLoading(true);
        try {
            const propertyIds = subagent ? (subagent.assignedProperties || []) : null;

            const handleAuthFailure = (err) => {
                const errorMsg = err?.message || '';
                if (errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('token') || errorMsg.includes('401')) {
                    console.warn('Session expired or unauthorized token detected. Redirecting...');
                    router.push('/');
                }
            };

            const [statsData, reportData, smsData] = await Promise.all([
                getStats(m, propertyIds).catch(err => {
                    console.error('[DASHBOARD] Stats failed:', err);
                    handleAuthFailure(err);
                    return null;
                }),
                getMonthlyReport(m, propertyIds).catch(err => {
                    console.error('[DASHBOARD] Report failed:', err);
                    handleAuthFailure(err);
                    return null;
                }),
                getSmsUsage().catch(err => {
                    console.error('[DASHBOARD] SMS Usage failed:', err);
                    handleAuthFailure(err);
                    return null;
                }),
            ]);

            setStats(statsData?.data || statsData);
            setReport(reportData?.data || reportData?.report || reportData);
            setSmsUsage(smsData?.data || smsData);

            const propsData = await getProperties().catch(err => {
                console.error('[DASHBOARD] Properties failed:', err);
                handleAuthFailure(err);
                return [];
            });
            const props = propsData?.data || propsData || [];

            // Filter properties if subagent is selected
            const filteredProps = propertyIds
                ? props.filter(p => propertyIds.includes(p.id))
                : props;

            const allCosts = [];
            await Promise.all(filteredProps.map(async (p) => {
                const c = await getRunningCosts(p.id, m).catch(err => {
                    console.error(`[DASHBOARD] Costs failed for ${p.id}:`, err);
                    handleAuthFailure(err);
                    return null;
                });
                const list = c?.data?.costs || c?.costs || [];
                list.forEach((x) => allCosts.push({ ...x, propertyName: p.propertyName }));
            }));
            setCosts(allCosts);

            // Fetch staff performance if global view
            if (isAdmin && !subagent) {
                const perf = await getStaffPerformance(m).catch(err => {
                    handleAuthFailure(err);
                    return { data: [] };
                });
                setStaffPerformance(perf.data || []);
            }
        } catch (e) {
            console.error('[DASHBOARD] Critical fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            getSubagents().then(res => setSubagents(res.data || [])).catch(err => console.error('Failed to fetch subagents', err));
        }
    }, [isAdmin]);

    useEffect(() => { fetchAll(month, false, selectedSubagent); }, [month, selectedSubagent, fetchAll]);

    if (loading) return <LoadingPage />;

    const summary = report?.summary || {};
    const tenants = report?.tenants || [];
    const collected = summary.totalReceived || 0;
    const expected = summary.totalExpected || 0;
    const outstanding = summary.totalRemaining !== undefined ? summary.totalRemaining : Math.max(0, expected - collected);
    const expenses = costs.reduce((a, c) => a + (c.amount || 0), 0);
    const net = collected - expenses;

    const paid = summary.paidInFull || tenants.filter(t => t.status?.toLowerCase() === 'paid').length;
    const partial = summary.partialPayment || tenants.filter(t => t.status?.toLowerCase() === 'partial').length;
    const unpaid = summary.unpaid || tenants.filter(t => t.status?.toLowerCase() === 'unpaid').length;

    const displayMonth = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const recentPayments = tenants
        .flatMap(t => (t.payments || []).map(p => ({
            ...p, tenantName: t.name || t.tenantName, unitCode: t.unitName || t.unitCode,
        })))
        .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
        .slice(0, 6);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ── Page Header & Controls ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left: Title + Tab Toggle */}
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">{displayMonth}</h2>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-widest">Performance Overview</p>
                    </div>
                    {/* Income/Expenses Toggle Pill */}
                    <div className="flex items-center bg-[#F1F5F9] rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('income')}
                            className={`h-7 px-4 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${activeTab === 'income' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                        >Income</button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`h-7 px-4 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${activeTab === 'expenses' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                        >Expenses</button>
                    </div>
                </div>

                {/* Right: Month + Subagent + CTA */}
                <div className="flex items-center gap-2">
                    {/* Month Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMonthPicker(v => !v)}
                            className="h-8 px-3 flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-md text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                            <Calendar size={13} />
                            Select Month
                            <ChevronDown size={12} className={`transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                        </button>
                        {showMonthPicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                                <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden p-4 animate-zoom-in">
                                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-3">
                                        <button onClick={() => setPickerYear(y => y - 1)} className="p-1 hover:bg-[#F1F5F9] rounded-md transition-colors text-[#64748B] hover:text-[#0F172A]"><ChevronLeft size={16} /></button>
                                        <span className="text-[13px] font-bold text-[#0F172A]">{pickerYear}</span>
                                        <button onClick={() => setPickerYear(y => y + 1)} className="p-1 hover:bg-[#F1F5F9] rounded-md transition-colors text-[#64748B] hover:text-[#0F172A]"><ChevronRight size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, index) => {
                                            const mVal = String(index + 1).padStart(2, '0');
                                            const targetVal = `${pickerYear}-${mVal}`;
                                            const isSelected = targetVal === month;
                                            return (
                                                <button key={targetVal} onClick={() => { setMonth(targetVal); setShowMonthPicker(false); }}
                                                    className={`py-2 rounded-md text-[12px] font-medium transition-all ${isSelected ? 'bg-[#007AFF] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                                                >{mName}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Subagent Selector (Admin only) */}
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowSubagentSelect(v => !v)}
                                className="h-8 px-3 flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-md text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                            >
                                <Users size={13} />
                                <span>{selectedSubagent ? selectedSubagent.name : 'All Agents'}</span>
                                <ChevronDown size={12} className={`transition-transform ${showSubagentSelect ? 'rotate-180' : ''}`} />
                            </button>
                            {showSubagentSelect && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSubagentSelect(false)} />
                                    <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden py-1 animate-zoom-in">
                                        <button
                                            onClick={() => { setSelectedSubagent(null); setShowSubagentSelect(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${!selectedSubagent ? 'bg-[#F0F6FF] text-[#007AFF] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
                                        >All Agents (Global Stats)</button>
                                        <div className="border-t border-slate-100 my-1" />
                                        <div className="overflow-y-auto max-h-56">
                                            {subagents.length === 0 ? (
                                                <div className="px-4 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-center">No subagents found</div>
                                            ) : (
                                                subagents.map(agent => (
                                                    <button
                                                        key={agent.uid}
                                                        onClick={() => { setSelectedSubagent(agent); setShowSubagentSelect(false); }}
                                                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${selectedSubagent?.uid === agent.uid ? 'bg-[#F0F6FF] text-[#007AFF] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
                                                    >{agent.name}</button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/properties/new" className="bg-[#007AFF] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
                            <Plus size={14} /> Add Property
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Income Tab Content ── */}
            {activeTab === 'income' && (
                <div className="space-y-8 animate-fade-in">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                                    <TrendingUp size={16} />
                                </div>
                                <span className="text-xs text-[#64748B] font-medium uppercase tracking-widest">Collected</span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#16A34A]">{formatCurrency(collected)}</h3>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#F0F6FF] flex items-center justify-center text-[#007AFF]">
                                    <CreditCard size={16} />
                                </div>
                                <span className="text-xs text-[#64748B] font-medium uppercase tracking-widest">Expected</span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">{formatCurrency(expected)}</h3>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
                                    <Bell size={16} />
                                </div>
                                <span className="text-xs text-[#64748B] font-medium uppercase tracking-widest">Outstanding</span>
                            </div>
                            <h3 className={`text-lg font-semibold tracking-[-0.02em] ${outstanding > 0 ? 'text-[#D97706]' : 'text-[#94A3B8]'}`}>{formatCurrency(outstanding)}</h3>
                        </div>
                    </div>

                    {/* Recent Payments Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-medium text-[#0F172A] uppercase tracking-wider text-[#64748B]">Recent Payments</h3>
                            <Link href="/dashboard/transactions" className="text-xs font-medium text-[#64748B] hover:text-[#007AFF] transition-colors flex items-center gap-1">View All <ArrowRight size={12} /></Link>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            {recentPayments.length === 0 ? (
                                <div className="py-12 text-center text-[13px] text-[#64748B]">No payments recorded this month.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Tenant</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Code</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Date</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] text-right">Amount</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F5F9]">
                                            {recentPayments.map((p, i) => (
                                                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#0F172A]">{p.tenantName || '—'}</td>
                                                    <td className="px-6 py-4 text-[11px] font-mono text-[#475569] uppercase font-semibold">{p.transactionCode || p.mpesaReceiptNumber || p.transactionId || '—'}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#64748B]">{formatDate(p.date || p.timestamp)}</td>
                                                    <td className="px-6 py-4 text-[13px] font-semibold text-[#0F172A] text-right">{formatCurrency(p.amount)}</td>
                                                    <td className="px-6 py-4 text-[11px] font-medium text-[#64748B] uppercase tracking-wide">
                                                        <span className="px-2 py-0.5 bg-[#F1F5F9] rounded-md">{p.paymentMethod}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Expenses Tab Content ── */}
            {activeTab === 'expenses' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
                                    <Droplets size={16} />
                                </div>
                                <span className="text-xs font-medium text-[#64748B] uppercase tracking-widest">Running Costs</span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#D97706]">{formatCurrency(expenses)}</h3>
                            <p className="text-xs text-[#64748B] mt-1">Operational expenses</p>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-4 text-[#64748B]">
                                <ArrowRight size={16} />
                                <span className="text-xs font-medium text-[#64748B] uppercase tracking-widest">Total Outflow</span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">{formatCurrency(expenses)}</h3>
                            <p className="text-xs text-[#64748B] mt-1">Confirmed deductions</p>
                        </div>

                        <div className={`border rounded-lg p-5 ${net >= 0 ? 'bg-[#0F172A] border-[#0F172A]' : 'bg-[#DC2626] border-[#DC2626]'}`}>
                            <div className="flex items-center gap-3 mb-4 text-white/60">
                                <PieChart size={16} />
                                <span className="text-[11px] font-medium uppercase tracking-widest">Net Position</span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{formatCurrency(net)}</h3>
                            <p className="text-[11px] text-white/40 mt-1">{net >= 0 ? 'Net Profit' : 'Operational Deficit'}</p>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-medium text-[#0F172A] uppercase tracking-wider text-[#64748B]">Cost Breakdown</h3>
                            <Link href="/dashboard/running-costs" className="text-xs font-medium text-[#64748B] hover:text-[#007AFF] transition-colors flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            {costs.length === 0 ? (
                                <div className="py-12 text-center text-[13px] text-[#64748B]">No expenses recorded this month.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Category</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0]">Property</th>
                                                <th className="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wide border-b border-[#E2E8F0] text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F5F9]">
                                            {costs.map((c, i) => (
                                                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                    <td className="px-6 py-4 text-[13px] font-medium text-[#0F172A]">{c.feeName || c.name || c.category}</td>
                                                    <td className="px-6 py-4 text-[13px] text-[#64748B]">{c.propertyName || 'Portfolio'}</td>
                                                    <td className="px-6 py-4 text-[13px] font-semibold text-[#DC2626] text-right">{formatCurrency(c.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Agent Efficiency (Admin Only) ── */}
            {isAdmin && !selectedSubagent && staffPerformance.length > 0 && (
                <div className="mt-12">
                    <h3 className="card-title uppercase tracking-wider text-[#64748B] mb-4">Agent Efficiency</h3>
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-6 py-4 label-text uppercase tracking-widest">Agent</th>
                                        <th className="px-6 py-4 label-text uppercase tracking-widest text-right">Expected</th>
                                        <th className="px-6 py-4 label-text uppercase tracking-widest text-right">Collected</th>
                                        <th className="px-6 py-4 label-text uppercase tracking-widest text-right">Efficiency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {staffPerformance.map((agent) => (
                                        <tr key={agent.uid} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#F0F6FF] text-[#007AFF] flex items-center justify-center text-[11px] font-bold">
                                                        {agent.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-[#0F172A]">{agent.name}</p>
                                                        <p className="text-[11px] text-[#64748B]">{agent.propertyCount} Properties</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] font-medium text-[#0F172A] text-right">{formatCurrency(agent.expected)}</td>
                                            <td className="px-6 py-5 text-[13px] font-semibold text-[#16A34A] text-right">{formatCurrency(agent.collected)}</td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-[11px] font-bold ${agent.performance >= 90 ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                                                        {agent.performance.toFixed(0)}%
                                                    </span>
                                                    <div className="w-20 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${agent.performance >= 90 ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`}
                                                            style={{ width: `${Math.min(100, agent.performance)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
