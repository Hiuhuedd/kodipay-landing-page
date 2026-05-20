'use client';

import { useState, useEffect } from 'react';
import { getSmsUsage, purchaseSmsPlan, initiateMpesaStk, formatCurrency } from '@/lib/api';
import { PageHeader, LoadingPage, Modal, Tooltip } from '@/components/ui';
import { 
    MessageSquare, Zap, ShieldCheck, CreditCard, Check, ArrowRight, 
    Shield, Calendar, Info, Minus, Phone, HelpCircle, Upload, 
    FileText, UserPlus, Zap as ElectricIcon, Droplets, Bell
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';

export default function BillingPage() {
    const { user, refreshUser } = useAuth();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [success, setSuccess] = useState(false);
    const [mpesaPhone, setMpesaPhone] = useState('');

    // Dynamic pricing state loaded from Firestore
    const [prices, setPrices] = useState({
        starter: 3200,
        growth: 6500,
        professional: 15000,
        enterprise: 45000
    });

    useEffect(() => {
        // Fetch SMS usage
        getSmsUsage()
            .then(d => setUsage(d?.data || d))
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch dynamic pricing tiers
        const fetchPrices = async () => {
            try {
                const settingsRef = doc(db, 'settings', 'app-settings');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists() && settingsSnap.data().planPrices) {
                    const savedPrices = settingsSnap.data().planPrices;
                    setPrices({
                        starter: savedPrices.starter !== undefined ? Number(savedPrices.starter) : 3200,
                        growth: savedPrices.growth !== undefined ? Number(savedPrices.growth) : 6500,
                        professional: savedPrices.professional !== undefined ? Number(savedPrices.professional) : 15000,
                        enterprise: savedPrices.enterprise !== undefined ? Number(savedPrices.enterprise) : 45000,
                    });
                }
            } catch (err) {
                console.error("Failed to load dynamic plan pricing:", err);
            }
        };
        fetchPrices();
    }, []);

    const subscriptionPlans = [
        {
            id: 'starter',
            name: 'Starter Plan',
            price: `KSh ${prices.starter.toLocaleString()}`,
            period: 'per month',
            description: 'Essential management tools for small to mid-sized portfolios.',
            cta: 'Activate Starter',
            features: [
                { name: 'Up to 75 properties & 800 units', included: true },
                { name: '1,500 monthly SMS messages', included: true },
                { name: 'Rent collection via M-Pesa', included: true },
                { name: 'Manual payment recording', included: true },
                { name: 'Basic dashboard & reports', included: true },
                { name: 'Email support', included: true },
                { name: 'Electricity & Water billing', included: false },
                { name: 'Penalty automation', included: false },
                { name: 'Full reports & PDF export', included: false },
            ]
        },
        {
            id: 'growth',
            name: 'Growth Plan',
            price: `KSh ${prices.growth.toLocaleString()}`,
            period: 'per month',
            popular: true,
            description: 'Advanced capabilities for growing agencies and managers.',
            cta: 'Activate Growth',
            features: [
                { name: 'Up to 150 properties & 2,500 units', included: true },
                { name: '5,000 monthly SMS messages', included: true },
                { name: 'Up to 5 subagents included', included: true },
                { name: 'Electricity & Water billing', included: true },
                { 
                    name: 'Penalty automation', 
                    included: true, 
                    tooltip: "KodiPay automatically adds a late fee to a tenant's account after a number of days you configure. No manual work needed." 
                },
                { name: 'SMS reminders & custom templates', included: true },
                { name: 'Payment receipts & templates', included: true },
                { name: 'Priority email support', included: true },
            ]
        },
        {
            id: 'professional',
            name: 'Professional Plan',
            price: `KSh ${prices.professional.toLocaleString()}`,
            period: 'per month',
            description: 'Enterprise control for large professional real estate managers.',
            cta: 'Activate Professional',
            features: [
                { name: 'Up to 500 properties & 10,000 units', included: true },
                { name: '15,000 monthly SMS messages', included: true },
                { name: 'Everything in Growth Plan', included: true },
                { name: 'Multi-property consolidated reports', included: true },
                { 
                    name: 'Bulk tenant import via CSV', 
                    included: true, 
                    tooltip: "Upload a spreadsheet of your existing tenants and KodiPay will add them all at once, saving hours of manual entry." 
                },
                { name: 'Dedicated account manager', included: true },
                { name: 'Phone & Email support', included: true },
                { name: 'Custom onboarding session', included: true },
            ]
        }
    ];

    const smsBundles = [
        { id: 'starter_sms', name: 'Starter Bundle', units: 1000, price: 500, description: 'Perfect for small properties' },
        { id: 'pro_sms', name: 'Professional Bundle', units: 3000, price: 1300, description: 'Most popular for growing agencies', popular: true },
        { id: 'enterprise_sms', name: 'Agency Prime', units: 10000, price: 4000, description: 'Best value for large portfolios' }
    ];

    const handlePurchaseSms = async (plan) => {
        setSelectedPlan({ ...plan, type: 'sms' });
    };

    const handleSubscriptionAction = (plan) => {
        setSelectedPlan({ ...plan, type: 'subscription' });
    };

    const handleConfirm = async () => {
        if (!selectedPlan) return;
        
        // M-Pesa Phone Validation
        if (!mpesaPhone || mpesaPhone.trim().length < 10) {
            alert('Please enter a valid Safaricom phone number (e.g., 0712345678)');
            return;
        }

        setSubmitting(true);
        try {
            let amountNum = 0;
            if (selectedPlan.type === 'sms') {
                amountNum = selectedPlan.price;
            } else {
                amountNum = parseFloat(selectedPlan.price.replace(/[^0-9]/g, ''));
            }

            const res = await initiateMpesaStk({
                phone: mpesaPhone,
                amount: amountNum,
                type: selectedPlan.type,
                planId: selectedPlan.id,
                units: selectedPlan.units || 0
            });

            if (!res.success) {
                throw new Error(res.error || 'Payment request rejected');
            }

            // Perform instant database upgrade for demo sandbox feedback
            if (user?.agencyId) {
                const agencyRef = doc(db, 'agencies', user.agencyId);
                
                if (selectedPlan.type === 'subscription') {
                    const propsLimit = selectedPlan.id === 'starter' ? 75 : selectedPlan.id === 'growth' ? 150 : 500;
                    const smsLimit = selectedPlan.id === 'starter' ? 1500 : selectedPlan.id === 'growth' ? 5000 : 15000;
                    
                    await updateDoc(agencyRef, {
                        'subscription.activePlan': selectedPlan.id,
                        'subscription.status': 'active',
                        'subscription.propertiesLimit': propsLimit,
                        'subscription.smsLimit': smsLimit,
                        'subscription.startedAt': new Date().toISOString(),
                        'subscription.nextPaymentAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        'smsStats.monthlyLimit': smsLimit
                    });
                } else if (selectedPlan.type === 'sms') {
                    const currentLimit = usage?.monthlyLimit || 2000;
                    const newLimit = currentLimit + (selectedPlan.units || 0);
                    
                    await updateDoc(agencyRef, {
                        'subscription.smsLimit': newLimit,
                        'smsStats.monthlyLimit': newLimit
                    });
                }

                // Force AuthContext to refresh local profile fields (including header status badges)
                if (refreshUser) {
                    await refreshUser();
                }
            }

            alert(res.message || 'M-Pesa STK Push initiated successfully! Please check your phone for the PIN prompt.');
            setSuccess(true);
            const updated = await getSmsUsage();
            setUsage(updated?.data || updated);
            
            // Trigger dynamic SMS counter refresh on the header
            window.dispatchEvent(new Event('kp_sms_updated'));
            
            setTimeout(() => {
                setSuccess(false);
                setSelectedPlan(null);
                setMpesaPhone('');
            }, 8000);
        } catch (e) {
            console.error(e);
            alert(e.message || 'M-Pesa transaction failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingPage />;

    const sent = usage?.monthlySent || 0;
    const limit = usage?.monthlyLimit || 2000;
    const remaining = Math.max(0, limit - sent);
    const pct = Math.round((sent / limit) * 100);

    return (
        <div className="pb-20 bg-[#F0F6FF]/20 min-h-screen font-sans">
            {/* ── Hero Section ── */}
            <div className="bg-gradient-to-b from-white to-[#F0F6FF] pt-20 pb-16 border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        Simple, Transparent Pricing.
                    </h1>
                    <p className="text-base md:text-lg font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                        Choose the plan that fits your portfolio. No hidden fees. Cancel any time.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-sky-100 flex items-center justify-center text-sky-600">
                                <Shield size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Secure Payments</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
                                <Check size={18} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Cancel Anytime</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                                <MessageSquare size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">2,000 SMS Included</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-16 space-y-24">
                {/* ── Pricing Plans Section ── */}
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {subscriptionPlans.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`relative flex flex-col rounded-3xl transition-all duration-500 overflow-hidden ${
                                    plan.popular 
                                    ? 'bg-sky-600 text-white shadow-[0_20px_50px_rgba(2,132,199,0.2)] scale-105 z-10' 
                                    : 'bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-2'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white text-sky-600 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg z-20">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                                    <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${plan.popular ? 'text-white/80' : 'text-slate-400'}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${plan.popular ? 'text-white/60' : 'text-slate-400'}`}>
                                            {plan.period}
                                        </span>
                                    </div>
                                    <p className={`text-xs font-semibold leading-relaxed mb-8 ${plan.popular ? 'text-white/80' : 'text-slate-500'}`}>
                                        {plan.description}
                                    </p>

                                    {(() => {
                                         const activePlanId = user?.subscription?.activePlan || 'starter_trial';
                                         const isCurrent = activePlanId === plan.id;
                                         const isDowngrade = (activePlanId === 'professional' && (plan.id === 'starter' || plan.id === 'growth')) ||
                                                             (activePlanId === 'growth' && plan.id === 'starter');
                                         const isButtonDisabled = isCurrent || isDowngrade;

                                         return (
                                             <button 
                                                 onClick={() => !isButtonDisabled && handleSubscriptionAction(plan)}
                                                 disabled={isButtonDisabled}
                                                 className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                     isCurrent 
                                                     ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                                     : plan.popular 
                                                     ? 'bg-white text-sky-600 hover:bg-slate-50' 
                                                     : 'bg-slate-900 text-white hover:bg-black'
                                                 }`}
                                             >
                                                 {isCurrent ? 'Current Plan' : isDowngrade ? 'Contact Support to Downgrade' : plan.cta}
                                             </button>
                                         );
                                     })()}
                                    {plan.footer && (
                                        <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                                            {plan.footer}
                                        </p>
                                    )}
                                </div>

                                <div className={`flex-1 p-8 space-y-4 ${plan.popular ? 'bg-sky-700/30' : 'bg-slate-50/50'}`}>
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                {feature.included ? (
                                                    <Check size={16} className={plan.popular ? 'text-white' : 'text-emerald-500'} strokeWidth={3} />
                                                ) : (
                                                    <Minus size={16} className={plan.popular ? 'text-white/20' : 'text-slate-300'} />
                                                )}
                                                <span className={`text-xs font-bold ${plan.popular ? 'text-white/90' : 'text-slate-700'} ${!feature.included ? 'opacity-40' : ''}`}>
                                                    {feature.name}
                                                </span>
                                            </div>
                                            {feature.tooltip && (
                                                <Tooltip text={feature.tooltip}>
                                                    <HelpCircle size={14} className={`cursor-help transition-opacity ${plan.popular ? 'text-white/40' : 'text-slate-300'}`} />
                                                </Tooltip>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-[11px] font-bold text-slate-400 mt-12 uppercase tracking-[0.15em]">
                        All plans include a 7-day grace period if your subscription lapses. Your data is never deleted.
                    </p>
                </div>

                {/* ── SMS Bundles Section ── */}
                <div className="space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Zap size={12} fill="currentColor" />
                            Add-ons
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Need more SMS?</h2>
                        <p className="text-sm font-semibold text-slate-400 mt-2">Purchase one-time bundles that never expire.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {smsBundles.map((bundle) => (
                            <div 
                                key={bundle.id}
                                className={`bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-all ${
                                    bundle.popular ? 'ring-2 ring-sky-100 border-sky-200' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <MessageSquare size={20} />
                                    </div>
                                    {bundle.popular && (
                                        <span className="bg-sky-50 text-sky-600 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                            Best Value
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{bundle.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{bundle.units.toLocaleString()} Units</p>
                                
                                <div className="text-2xl font-black text-slate-900 mb-8">{formatCurrency(bundle.price)}</div>
                                
                                <button 
                                    onClick={() => handlePurchaseSms(bundle)}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    Select Bundle
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Compact Usage Status Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 max-w-5xl mx-auto">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">SMS Sent</p>
                                        <p className="text-lg font-black text-slate-900 tabular-nums">{sent.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Monthly Limit</p>
                                        <p className="text-lg font-black text-slate-900 tabular-nums">{limit.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remaining</p>
                                        <p className={`text-lg font-black tabular-nums ${remaining > 500 ? 'text-emerald-500' : 'text-rose-500'}`}>{remaining.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                <div className="relative w-12 h-12">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-200" />
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-sky-500" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * Math.min(100, pct)) / 100} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-slate-900">{pct}%</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Usage</p>
                                    <p className="text-[10px] font-black text-slate-900 uppercase">Consumed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {selectedPlan && (
                <Modal 
                    title={success ? "Success!" : (selectedPlan.type === 'sms' ? "Confirm Bundle Purchase" : "Plan Subscription")} 
                    onClose={() => !submitting && setSelectedPlan(null)}
                    maxWidth="max-w-md"
                >
                    <div className="py-2">
                        {success ? (
                            <div className="text-center py-8 animate-in zoom-in duration-500 flex flex-col items-center">
                                {/* Celebratory Pulsing Badge */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
                                    <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                                        <Check size={40} strokeWidth={3} className="animate-bounce" />
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider mb-3">
                                    🎉 UPGRADE SUCCESSFUL
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Congratulations!
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                                    Your account has been upgraded to the <span className="text-slate-900 font-bold uppercase">{selectedPlan.name}</span>. Your workspace features and billing quotas are now fully unlocked!
                                </p>

                                {/* Premium Plan Limits Details */}
                                <div className="w-full bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 mt-6 space-y-3.5 text-left text-xs font-bold text-slate-700 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Active Workspace Plan</span>
                                        <span className="text-slate-900 uppercase font-black">{selectedPlan.name}</span>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Properties Limit</span>
                                        <span className="text-[#007AFF] font-black">
                                            {selectedPlan.type === 'sms' ? 'Unchanged' : (selectedPlan.id === 'starter' ? '75 Properties' : selectedPlan.id === 'growth' ? '150 Properties' : '500 Properties')}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Monthly SMS Quota</span>
                                        <span className="text-emerald-600 font-black">
                                            {selectedPlan.type === 'sms' 
                                                ? `${((usage?.monthlyLimit || 2000) + (selectedPlan.units || 0)).toLocaleString()} Units` 
                                                : (selectedPlan.id === 'starter' ? '1,500 Units' : selectedPlan.id === 'growth' ? '5,000 Units' : '15,000 Units')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSuccess(false);
                                        setSelectedPlan(null);
                                        setMpesaPhone('');
                                    }}
                                    className="w-full mt-6 py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-200"
                                >
                                    Dismiss & Continue
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selection</span>
                                        <span className="text-sm font-black text-slate-900 uppercase">{selectedPlan.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</span>
                                        <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                                            {selectedPlan.type === 'sms' ? 'Add-on Bundle' : 'Subscription Plan'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-4" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-xl font-black text-emerald-600">
                                            {selectedPlan.price === 'Free' ? 'Free' : (typeof selectedPlan.price === 'number' ? formatCurrency(selectedPlan.price) : selectedPlan.price)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">M-PESA Phone Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">+254</span>
                                        <input 
                                            type="text" 
                                            value={mpesaPhone}
                                            onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="07XXXXXXXX"
                                            disabled={submitting}
                                            className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all outline-none"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400">Enter your Safaricom M-Pesa number to receive the payment STK push pin prompt.</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                        ) : (
                                            <>
                                                <CreditCard size={16} />
                                                Pay with M-Pesa
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setSelectedPlan(null)}
                                        disabled={submitting}
                                        className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
