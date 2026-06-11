'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
    Building2, ShieldCheck, MessageSquare, Landmark,
    Smartphone, ArrowRight, Zap, Droplets, Check,
    Sparkles, Key, BarChart3, ChevronRight, HelpCircle, Star,
    Download, Network, Menu, X, Users, Receipt, AlertCircle, Phone
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { submitDemoRequest, sendTestSms } from '@/lib/api';

export default function RootPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Dynamic pricing state loaded from Firestore
    const [prices, setPrices] = useState({
        starter: 3200,
        growth: 6500,
        professional: 15000,
        enterprise: 45000
    });

    useEffect(() => {
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
                console.error("Failed to load dynamic pricing tiers:", err);
            }
        };
        fetchPrices();
    }, []);

    // Demo Modal States
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [demoSubmitted, setDemoSubmitted] = useState(false);
    const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', portfolioSize: '10-50' });

    // Mobile Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // SMS Sample State
    const [smsPhone, setSmsPhone] = useState('');
    const [smsName, setSmsName] = useState('ED');
    const [smsAmount, setSmsAmount] = useState('11,175');
    const [smsStatus, setSmsStatus] = useState('idle'); // idle, sending, sent

    const handleSendSampleSms = async (e) => {
        e.preventDefault();
        if (!smsPhone) return;
        setSmsStatus('sending');
        try {
            const message = `Dear ${smsName}, rent for unit A1 is due. Please pay KSh ${smsAmount} via Paybill M-Pesa Paybill 4005473`;
            await sendTestSms(smsPhone, message);
            setSmsStatus('sent');
            setTimeout(() => setSmsStatus('idle'), 4000);
        } catch (err) {
            console.error(err);
            setSmsStatus('idle');
            alert('Failed to send SMS');
        }
    };

    // Features list for navigation
    const featureLinks = [
        { id: 'record-keeping', label: 'Agency Record Keeping' },
        { id: 'payment-matching', label: 'Tenant-Payment Matching' },
        { id: 'sms-reminders', label: 'SMS Reminders' },
        { id: 'sub-agency', label: 'Sub Agency' },
        { id: 'utilities-billing', label: 'Utilities Billing' },
        { id: 'reports', label: 'Reports' },
        { id: 'penalties', label: 'Late Penalties' }
    ];

    // Cycling words for hero section text animation
    const words = ["The easiest", "The simplest", "The smartest", "The fastest", "The modern"];
    const [wordIndex, setWordIndex] = useState(0);
    const [animState, setAnimState] = useState('idle'); // 'idle' | 'exiting' | 'entering'

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimState('exiting');
            setTimeout(() => {
                setWordIndex((prev) => (prev + 1) % words.length);
                setAnimState('entering');
                setTimeout(() => {
                    setAnimState('idle');
                }, 50); // Tiny pause to allow the browser to paint the new entry position
            }, 400); // matches transition out duration
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    const handleDemoSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitDemoRequest(demoForm);
            setDemoSubmitted(true);
            setTimeout(() => {
                setShowDemoModal(false);
                setDemoSubmitted(false);
                setDemoForm({ name: '', email: '', phone: '', portfolioSize: '10-50' });
            }, 3000);
        } catch (err) {
            console.error("Demo submission failed:", err);
            alert("Failed to submit request: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="relative flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-[#E2E8F0] border-t-[#007AFF] rounded-full animate-spin"></div>
                    <div className="mt-6 text-[#64748B] text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">Loading</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-[#0F172A] font-sans antialiased overflow-x-hidden text-left scroll-smooth">
            {/* ── Header Navigation ── */}
            <header className="fixed top-0 inset-x-0 h-16 bg-[#0047a5] border-b border-white/10 z-50 px-6 lg:px-12 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                        <img src="/kodipay-logo.png" alt="KodiPay Logo" className="h-10 w-auto object-contain brightness-0 invert" />
                    </div>
                    <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">Simple & Easy</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden xl:flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1.5 rounded-full border border-white/20">
                    {featureLinks.map(link => (
                        <a key={link.id} href={`#${link.id}`} className="text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">{link.label}</a>
                    ))}
                    <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                    <a href="#pricing" className="text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">Pricing</a>
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <Link
                            href="/dashboard"
                            className="bg-white text-[#0047a5] text-xs font-bold h-9 px-4 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            Dashboard <ArrowRight size={13} />
                        </Link>
                    ) : (
                        <>
                            <Link href="/signin" className="text-xs font-semibold text-white/80 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-white text-[#0047a5] text-xs font-bold h-9 px-4 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-white focus:outline-none"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] md:hidden overflow-y-auto px-6 py-8">
                    <style>{`
                        @keyframes fadeSlideIn {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    <nav className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Features</p>
                            {featureLinks.map((link, i) => (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    className="flex items-center justify-between text-base font-bold text-[#0F172A] py-3 border-b border-[#F1F5F9] last:border-0 hover:text-[#007AFF] transition-colors"
                                    style={{ 
                                        animation: `fadeSlideIn 0.3s ease forwards ${i * 0.05}s`,
                                        opacity: 0
                                    }}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-[#007AFF] bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full shrink-0">{i + 1}</span>
                                        {link.label}
                                    </span>
                                    <ChevronRight size={16} className="text-[#94A3B8]" />
                                </a>
                            ))}
                            <a
                                href="#pricing"
                                className="block text-lg font-bold text-[#0F172A]"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Pricing
                            </a>
                        </div>
                        <hr className="border-[#E2E8F0]" />
                        <div className="flex flex-col gap-4">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="bg-[#007AFF] text-white text-sm font-bold h-12 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    Go to Dashboard <ArrowRight size={16} />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/signin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="border border-[#E2E8F0] text-[#0F172A] text-sm font-bold h-12 rounded-md flex items-center justify-center transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="bg-[#007AFF] text-white text-sm font-bold h-12 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Get Started Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}

            {/* ── Hero Section ── */}
            <section
                className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 lg:px-12 bg-white overflow-hidden z-10"
            >

                <div className="max-w-3xl mx-auto text-center space-y-6 flex flex-col items-center">

                    <h1 className="text-4xl lg:text-[46px] font-extrabold tracking-[-0.03em] leading-[1.1] text-[#0F172A]">
                        <span
                            className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#007AFF] via-blue-500 to-[#007AFF] font-extrabold pr-1 ${animState === 'exiting'
                                    ? 'transition-all duration-400 ease-in opacity-0 -translate-y-4'
                                    : animState === 'entering'
                                        ? 'transition-none opacity-0 translate-y-4'
                                        : 'transition-all duration-500 ease-out opacity-100 translate-y-0'
                                }`}
                        >
                            {words[wordIndex]}
                        </span>{' '}
                        way to manage your rental properties.
                    </h1>
                    <p className="text-sm lg:text-base text-[#64748B] leading-relaxed max-w-xl mx-auto">
                        Manage tenants, send automatic payment reminders, and keep track of your income and expenses in one simple place.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link
                            href="/signup"
                            className="bg-[#007AFF] text-white text-xs font-bold h-11 px-6 rounded-md hover:bg-blue-600 transition-all flex items-center gap-2  transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            Get Started Free <ArrowRight size={14} />
                        </Link>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold h-11 px-6 rounded-md hover:bg-[#F1F5F9] transition-all flex items-center gap-2 shadow-sm transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            Ask for a Demo
                        </button>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-[#E2E8F0] w-full max-w-md mx-auto text-center">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-[#F1F5F9] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#64748B]">
                                    {i === 4 ? '+2k' : `A${i}`}
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">
                            Trusted by over <strong className="text-white">250 landlords and agents</strong> across East Africa.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 1. Consistent Agency Record Keeping ── */}
            <section id="record-keeping" className="py-20 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-[#007AFF] rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 1</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Consistent Agency Record Keeping
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Maintain flawless financial and operational records. KodiPay securely logs every transaction, property update, and tenant history, ensuring your agency stays organized, compliant, and ready for any audit. No more missing paperwork or scattered spreadsheets.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl shadow-inner">
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center"><Building2 size={18} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0F172A]">Property Ledger {i}</p>
                                                <p className="text-[10px] text-[#64748B]">Updated just now</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-600">Synced</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 2. Automated Tenant-Payment Matching ── */}
            <section id="payment-matching" className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-y border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 2</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Automated Tenant-Payment Matching
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Say goodbye to manual reconciliation. KodiPay instantly connects bank transfers and M-Pesa payments directly to the correct tenant. Rent balances update in real-time without you lifting a finger.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xl space-y-5">
                            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                                <span className="text-xs font-bold text-[#64748B] uppercase">Incoming Payment</span>
                                <Network className="text-emerald-500" size={20} />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
                                    <Check size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-[#0F172A]">KES 25,000</p>
                                    <p className="text-xs text-[#64748B]">Matched to John Doe (Unit B4)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3. SMS Reminders ── */}
            <section id="sms-reminders" className="py-20 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 3</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Smart SMS Reminders
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Keep your tenants informed. Automatically send rent invoices, receipts, and polite payment reminders directly to their phones via SMS. Test it out below by sending a sample reminder to your phone!
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-[#0F172A] border border-[#334155] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 text-[#1E293B]">
                                <MessageSquare size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h3 className="text-white font-bold mb-1">Try a Sample SMS</h3>
                                    <p className="text-xs text-[#94A3B8]">See exactly what your tenants receive.</p>
                                </div>
                                <form onSubmit={handleSendSampleSms} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount</label>
                                            <input
                                                type="number"
                                                value={smsAmount}
                                                onChange={(e) => setSmsAmount(e.target.value)}
                                                className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-md outline-none text-xs text-white focus:border-blue-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Sender Name</label>
                                            <input
                                                type="text"
                                                value={smsName}
                                                onChange={(e) => setSmsName(e.target.value)}
                                                className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-md outline-none text-xs text-white focus:border-blue-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Your Phone Number</label>
                                        <input
                                            type="tel"
                                            value={smsPhone}
                                            onChange={(e) => setSmsPhone(e.target.value)}
                                            placeholder="e.g. 07XX XXX XXX"
                                            required
                                            className="w-full h-10 px-3 bg-white border border-transparent rounded-md outline-none text-xs text-[#0F172A] focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={smsStatus === 'sending'}
                                        className="w-full h-11 bg-[#007AFF] hover:bg-blue-500 text-white text-xs font-bold rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {smsStatus === 'sending' ? (
                                            <span className="animate-pulse">Sending...</span>
                                        ) : smsStatus === 'sent' ? (
                                            <><Check size={16} /> Sample Sent Successfully!</>
                                        ) : (
                                            <><Smartphone size={16} /> Send Sample SMS</>
                                        )}
                                    </button>
                                </form>

                                {/* Sample Preview Message */}
                                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-[#CBD5E1] font-mono leading-relaxed">
                                    "Dear {smsName}, rent for unit A1 is due. Please pay KSh {smsAmount} via Paybill M-Pesa Paybill 4005473"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 4. Sub Agency ── */}
            <section id="sub-agency" className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-y border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 4</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Sub Agency Management
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Scale your business effortlessly. Create accounts for your subagents, assign them specific properties, and track their performance. Maintain overall control while empowering your team to collect rent efficiently.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
                                <Users className="text-purple-600" size={24} />
                                <h3 className="font-bold text-sm text-[#0F172A]">Team Overview</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Angela Mwangi', role: 'Agent', props: '4 assigned', color: 'bg-purple-100 text-purple-700' },
                                    { name: 'David Ochieng', role: 'Agent', props: '2 assigned', color: 'bg-blue-100 text-blue-700' }
                                ].map((agent, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 hover:bg-[#F8FAFC] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0]">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center font-bold text-xs`}>
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#0F172A]">{agent.name}</p>
                                                <p className="text-[10px] text-[#64748B]">{agent.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded">{agent.props}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 5. Utilities Billing ── */}
            <section id="utilities-billing" className="py-20 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 5</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Utilities Billing
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Record electricity and water meter readings accurately. KodiPay manages tiered utility rates and automatically bills tenants the correct amount alongside their rent. Never lose track of utility consumption again.
                        </p>
                    </div>
                    <div className="flex-1 w-full grid grid-cols-2 gap-4">
                        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm text-center space-y-3">
                            <div className="mx-auto w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center"><Zap size={24} /></div>
                            <h3 className="font-bold text-[#0F172A] text-sm">Electricity</h3>
                            <p className="text-xs text-[#64748B]">Tiered billing integrated</p>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm text-center space-y-3">
                            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Droplets size={24} /></div>
                            <h3 className="font-bold text-[#0F172A] text-sm">Water</h3>
                            <p className="text-xs text-[#64748B]">Fixed & variable rates</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 6. Reports ── */}
            <section id="reports" className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-y border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 6</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Comprehensive Reports
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Make informed business decisions with deep insights. Generate monthly statements, rent arrears summaries, and collection performance metrics. Downloadable in PDF and CSV for your accountants.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xl space-y-5">
                            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                                <span className="text-xs font-bold text-[#64748B] uppercase">Monthly Overview</span>
                                <BarChart3 className="text-indigo-500" size={20} />
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-indigo-50 rounded-full overflow-hidden flex">
                                    <div className="bg-indigo-500 w-[75%] h-full"></div>
                                    <div className="bg-indigo-200 w-[15%] h-full"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-[#64748B]">
                                    <span className="text-indigo-600">Collected: 75%</span>
                                    <span>Pending: 15%</span>
                                    <span>Defaults: 10%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 7. Late Payment Penalties ── */}
            <section id="penalties" className="py-20 px-6 lg:px-12 bg-white border-b border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 text-red-600 rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Feature 7</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                            Late Payment Penalties
                        </h2>
                        <p className="text-sm lg:text-base text-[#64748B] leading-relaxed">
                            Encourage timely payments. Set custom late penalty rules (fixed amounts or percentages) and KodiPay will automatically apply them to overdue tenant invoices after the grace period ends.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl shadow-sm text-left flex flex-col md:flex-row items-center md:items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="font-bold text-red-800 text-sm">Penalty Applied Automatically</h3>
                                <p className="text-xs text-red-600 mt-2 leading-relaxed">
                                    A penalty of KES 500 has been applied to Unit 402 for exceeding the payment deadline by 5 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Transparent Pricing Section ── */}
            <section id="pricing" className="py-20 px-6 lg:px-12 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="max-w-xl mx-auto text-center space-y-3">
                        <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Simple Pricing Plans</p>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Clear and Honest Pricing</h2>
                        <p className="text-[#64748B] text-xs">
                            All plans include bookkeeping tools and SMS reminders with no hidden fees or charges.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Plan 1 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-xs text-[#64748B] uppercase tracking-widest">Starter Plan</h3>
                                    <p className="text-3xl font-extrabold tracking-tight text-[#0F172A] mt-2">KES {prices.starter.toLocaleString()}<span className="text-xs font-semibold text-[#64748B]"> / month</span></p>
                                    <p className="text-[10px] text-[#64748B] mt-1">Essential tools for small to mid portfolios</p>
                                </div>
                                <div className="border-t border-[#F1F5F9] pt-4 space-y-3 text-xs text-left">
                                    <PricingItem label="Up to 75 properties & 800 units" />
                                    <PricingItem label="1,500 monthly SMS messages" />
                                    <PricingItem label="Rent collection via M-Pesa" />
                                    <PricingItem label="Manual payment recording" />
                                    <PricingItem label="Basic dashboard & reports" />
                                    <PricingItem label="Email support" />
                                </div>
                            </div>
                            <Link href="/signup" className="mt-8 w-full h-10 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold rounded-md flex items-center justify-center transition-colors">
                                Get Started Free
                            </Link>
                        </div>

                        {/* Plan 2 - Highlighted */}
                        <div className="bg-white border-2 border-[#007AFF] rounded-xl p-6 shadow-md flex flex-col justify-between relative">
                            <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#007AFF] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-xs text-[#007AFF] uppercase tracking-widest">Growth Plan</h3>
                                    <p className="text-3xl font-extrabold tracking-tight text-[#0F172A] mt-2">KES {prices.growth.toLocaleString()}<span className="text-xs font-semibold text-[#64748B]"> / month</span></p>
                                    <p className="text-[10px] text-[#64748B] mt-1">Great for growing property managers</p>
                                </div>
                                <div className="border-t border-[#F1F5F9] pt-4 space-y-3 text-xs text-left">
                                    <PricingItem label="Up to 150 properties & 2,500 units" />
                                    <PricingItem label="5,000 monthly SMS messages" />
                                    <PricingItem label="Up to 5 subagents included" />
                                    <PricingItem label="Electricity & Water billing" />
                                    <PricingItem label="Automated late penalty fees" />
                                    <PricingItem label="SMS reminders & custom templates" />
                                    <PricingItem label="Priority email support" />
                                </div>
                            </div>
                            <Link href="/signup" className="mt-8 w-full h-10 bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold rounded-md flex items-center justify-center transition-colors shadow-sm shadow-blue-100">
                                Choose Growth Plan
                            </Link>
                        </div>

                        {/* Plan 3 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-xs text-[#64748B] uppercase tracking-widest">Professional Plan</h3>
                                    <p className="text-3xl font-extrabold tracking-tight text-[#0F172A] mt-2">KES {prices.professional.toLocaleString()}<span className="text-xs font-semibold text-[#64748B]"> / month</span></p>
                                    <p className="text-[10px] text-[#64748B] mt-1">For large property management businesses</p>
                                </div>
                                <div className="border-t border-[#F1F5F9] pt-4 space-y-3 text-xs text-left">
                                    <PricingItem label="Up to 500 properties & 10,000 units" />
                                    <PricingItem label="15,000 monthly SMS messages" />
                                    <PricingItem label="Everything in Growth Plan" />
                                    <PricingItem label="Multi-property consolidated reports" />
                                    <PricingItem label="Bulk tenant import via CSV" />
                                    <PricingItem label="Dedicated account manager" />
                                    <PricingItem label="Phone & Email support" />
                                    <PricingItem label="Custom onboarding session" />
                                </div>
                            </div>
                            <Link href="/signup" className="mt-8 w-full h-10 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold rounded-md flex items-center justify-center transition-colors">
                                Choose Professional
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-[#0F172A] text-white py-12 px-6 lg:px-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center">
                            <img src="/kodipay-logo.png" alt="KodiPay Logo" className="h-8 w-auto object-contain" />
                        </div>
                        <span className="font-bold text-[14px] tracking-tight">KodiPay</span>
                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest ml-2">&copy; {new Date().getFullYear()} KodiPay Systems Ltd.</span>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                        <Link href="/policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <span className="text-white/10">·</span>
                        <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
                        <span className="text-white/10">·</span>
                        <span className="inline-flex items-center gap-1 text-[#10B981]">
                            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" /> System is online & working
                        </span>
                    </div>
                </div>
            </footer>

            {/* ── Demo Lead Capture Modal ── */}
            {showDemoModal && (
                <div className="fixed inset-0 z-[999] bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative p-6 animate-zoom-in text-left">
                        <button
                            onClick={() => setShowDemoModal(false)}
                            className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] transition-colors font-bold text-xs"
                        >✕</button>

                        {demoSubmitted ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                                    <Check size={24} />
                                </div>
                                <h3 className="font-extrabold text-base text-[#0F172A]">Demo Requested</h3>
                                <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
                                    Thank you! Our support team will contact you within 2 hours to help you set up your account.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleDemoSubmit} className="space-y-4">
                                <div>
                                    <h3 className="font-extrabold text-base text-[#0F172A] tracking-tight">Get in Touch</h3>
                                    <p className="text-xs text-[#64748B] mt-1">Let us show you how KodiPay can make managing your properties easier.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Your Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter full name"
                                        value={demoForm.name}
                                        onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="name@example.com"
                                        value={demoForm.email}
                                        onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="07XX XXX XXX"
                                        value={demoForm.phone}
                                        onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Number of Rental Units</label>
                                    <select
                                        value={demoForm.portfolioSize}
                                        onChange={e => setDemoForm({ ...demoForm, portfolioSize: e.target.value })}
                                        className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                    >
                                        <option value="1-10">1 - 10 units</option>
                                        <option value="10-50">10 - 50 units</option>
                                        <option value="50-200">50 - 200 units</option>
                                        <option value="200+">More than 200 units</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full h-11 bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold rounded-md transition-colors shadow-sm"
                                >
                                    Send Request
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function PricingItem({ label }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Check size={10} className="text-emerald-600" />
            </div>
            <span className="text-[#475569]">{label}</span>
        </div>
    );
}
