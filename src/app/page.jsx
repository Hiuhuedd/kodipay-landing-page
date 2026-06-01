'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
    Building2, ShieldCheck, MessageSquare, Landmark, 
    Smartphone, ArrowRight, Zap, Droplets, Check, 
    Sparkles, Key, BarChart3, ChevronRight, HelpCircle, Star,
    Download, Network
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { submitDemoRequest } from '@/lib/api';

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

    // Tab switchers
    const [activeTab, setActiveTab] = useState('ledgers'); // 'ledgers' | 'utilities' | 'agents'
    const [integrationTab, setIntegrationTab] = useState('payments'); // 'payments' | 'bills'
    const [expandedGuide, setExpandedGuide] = useState(null); // null | 'mpesa' | 'bank' | 'sms' | 'bills'
    const [calcTab, setCalcTab] = useState('electricity'); // 'electricity' | 'water'
    
    // Calculator States
    const [prevRead, setPrevRead] = useState('120');
    const [currRead, setCurrRead] = useState('155');
    const [waterUsage, setWaterUsage] = useState('4.5');

    // Demo Modal States
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [demoSubmitted, setDemoSubmitted] = useState(false);
    const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', portfolioSize: '10-50' });

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

    // Live calculations
    const getElectricityBill = () => {
        const p = parseFloat(prevRead) || 0;
        const c = parseFloat(currRead) || 0;
        const consumption = Math.max(0, c - p);
        
        // Tiered Pricing: Tier 1: 0-30 @ KES 12, Tier 2: 30-100 @ KES 16.45, Tier 3: 100+ @ KES 19.08
        let rawBill = 0;
        if (consumption <= 30) {
            rawBill = consumption * 12;
        } else if (consumption <= 100) {
            rawBill = (30 * 12) + ((consumption - 30) * 16.45);
        } else {
            rawBill = (30 * 12) + (70 * 16.45) + ((consumption - 100) * 19.08);
        }
        
        return {
            consumption: consumption.toFixed(1),
            roundedTotal: Math.round(rawBill),
            isTiered: true
        };
    };

    const getWaterBill = () => {
        const usage = parseFloat(waterUsage) || 0;
        // Standard rate KES 135 per unit + KES 100 standing fee
        const rawBill = (usage * 135) + 100;
        return {
            consumption: usage.toFixed(1),
            roundedTotal: Math.round(rawBill),
            isTiered: false
        };
    };

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

    const calcResult = calcTab === 'electricity' ? getElectricityBill() : getWaterBill();

    return (
        <div className="min-h-screen bg-white text-[#0F172A] font-sans antialiased overflow-x-hidden text-left">
            {/* ── Header Navigation ── */}
            <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] z-50 px-6 lg:px-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shadow-sm">
                        <Building2 size={16} />
                    </div>
                    <span className="font-bold text-[15px] tracking-tight text-[#0F172A]">KodiPay</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded border border-blue-100">Simple & Easy</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B]">
                    <a href="#features" className="hover:text-[#0F172A] transition-colors">How it Helps</a>
                    <a href="#playground" className="hover:text-[#0F172A] transition-colors">Bill Calculator</a>
                    <a href="#console" className="hover:text-[#0F172A] transition-colors">Preview</a>
                    <a href="#integrations" className="hover:text-[#0F172A] transition-colors">Integrations</a>
                    <a href="#pricing" className="hover:text-[#0F172A] transition-colors">Pricing</a>
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <Link 
                            href="/dashboard"
                            className="bg-[#007AFF] text-white text-xs font-bold h-9 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-100"
                        >
                            Go to Dashboard <ArrowRight size={13} />
                        </Link>
                    ) : (
                        <>
                            <Link href="/signin" className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors">
                                Sign In
                            </Link>
                            <Link 
                                href="/signup"
                                className="bg-[#007AFF] text-white text-xs font-bold h-9 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-100"
                            >
                                Get Started Free
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section 
                className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 lg:px-12 bg-cover bg-center bg-no-repeat overflow-hidden z-10"
                style={{ backgroundImage: "url('/premium_photo.avif')" }}
            >
                {/* Premium Dark Overlay with a subtle backdrop blur for luxury cinematic feel */}
                <div className="absolute inset-0 bg-[#3C280D]/45 backdrop-blur-[1px] -z-10" />
                
                <div className="max-w-3xl mx-auto text-center space-y-6 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-blue-400 rounded-full">
                        <Sparkles size={11} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Simple Bookkeeping · Easy Property Management</span>
                    </div>
                    <h1 className="text-4xl lg:text-[46px] font-extrabold tracking-[-0.03em] leading-[1.1] text-white">
                        <span 
                            className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 font-extrabold pr-1 ${
                                animState === 'exiting' 
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
                    <p className="text-sm lg:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                        Manage tenants. Easily calculate water and electricity bills, send automatic payment reminders to tenants, and keep track of your income and expenses in one simple place.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link 
                            href="/signup"
                            className="bg-[#007AFF] text-white text-xs font-bold h-11 px-6 rounded-md hover:bg-blue-600 transition-all flex items-center gap-2 shadow-md shadow-blue-100 transform hover:-translate-y-0.5 cursor-pointer"
                            id="btn-hero-signup"
                        >
                            Get Started Free <ArrowRight size={14} />
                        </Link>
                        <button 
                            onClick={() => setShowDemoModal(true)}
                            className="bg-white/10 border border-white/20 text-white text-xs font-bold h-11 px-6 rounded-md hover:bg-white/20 transition-all flex items-center gap-2 shadow-sm transform hover:-translate-y-0.5 cursor-pointer"
                            id="btn-hero-demo"
                        >
                            Ask for a Demo
                        </button>
                    </div>
                    
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-white/10 w-full max-w-md mx-auto text-center">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#0F172A] flex items-center justify-center text-[10px] font-bold text-slate-300">
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

            {/* ── Interactive Bill Calculator Section ── */}
            <section id="playground" className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left side describing calculator details */}
                    <div className="lg:col-span-5 space-y-5 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-[#16A34A] rounded-full">
                            <Zap size={11} className="animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Try it out now</span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">
                            Calculate tenant bills in seconds.
                        </h2>
                        <p className="text-xs lg:text-sm text-[#64748B] leading-relaxed">
                            Use our live calculation playground to see how simple utility billing is with KodiPay. Choose water or electricity, type in the meter readings, and see the exact rounded bill computed instantly.
                        </p>
                        <div className="pt-2 space-y-3 text-xs text-[#64748B]">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[10px]">1</div>
                                <span>Select utility rate calculations (water or electricity)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[10px]">2</div>
                                <span>Input the previous and current meter readings</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[10px]">3</div>
                                <span>Copy or print the final rounded shilling amount instantly</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side interactive playground box */}
                    <div className="lg:col-span-7">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden relative">
                            {/* Decorative header */}
                            <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-[#007AFF] to-[#00C3FF]"></div>
                            
                            <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-[13px] text-[#0F172A] uppercase tracking-wider">Live Bill Calculator</h3>
                                    <p className="text-[10px] text-[#64748B] mt-0.5">Calculate your water or electricity bills instantly.</p>
                                </div>
                                <div className="flex bg-[#F1F5F9] p-0.5 rounded-md">
                                    <button 
                                        onClick={() => setCalcTab('electricity')}
                                        className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${calcTab === 'electricity' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                                    >Electricity</button>
                                    <button 
                                        onClick={() => setCalcTab('water')}
                                        className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${calcTab === 'water' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                                    >Water</button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {calcTab === 'electricity' ? (
                                    <div className="space-y-4">
                                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-lg text-xs leading-relaxed text-[#64748B]">
                                            <strong className="text-[#0F172A]">How electricity rates are calculated:</strong>
                                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#E2E8F0] text-[10px] uppercase font-bold text-center">
                                                <div>First 30 units: KES 12 each</div>
                                                <div>Next 70 units: KES 16.45 each</div>
                                                <div>Above 100 units: KES 19.08 each</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Previous Meter Reading (kWh)</label>
                                                <input 
                                                    type="number"
                                                    value={prevRead}
                                                    onChange={e => setPrevRead(e.target.value)}
                                                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                                    id="calc-elec-prev"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Current Meter Reading (kWh)</label>
                                                <input 
                                                    type="number"
                                                    value={currRead}
                                                    onChange={e => setCurrRead(e.target.value)}
                                                    className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                                    id="calc-elec-curr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-lg text-xs leading-relaxed text-[#64748B]">
                                            <strong className="text-[#0F172A]">How water rates are calculated:</strong>
                                            <p className="mt-1">Calculated at KES 135 for each unit of water used, plus a flat KES 100 monthly connection fee. Bills are rounded to the nearest shilling.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Water Units Used (m³)</label>
                                            <input 
                                                type="number"
                                                value={waterUsage}
                                                onChange={e => setWaterUsage(e.target.value)}
                                                className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md outline-none text-xs text-[#0F172A] focus:border-[#007AFF] focus:bg-white"
                                                id="calc-water-usage"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Bill calculations output console */}
                                <div className="bg-[#0F172A] text-white p-5 rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold tracking-widest text-[#94A3B8] uppercase">Your Calculated Bill</span>
                                        <span className="px-2 py-0.5 bg-white/10 text-white rounded text-[8px] font-semibold uppercase tracking-wider">Calculated Instantly</span>
                                    </div>
                                    
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-[#94A3B8]">Total Bill (Nearest Shilling)</p>
                                            <p className="text-3xl font-extrabold tracking-tight text-white mt-1" id="calc-result-bill">
                                                KES {calcResult.roundedTotal.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-[#94A3B8]">Total Units Used</p>
                                            <p className="text-sm font-semibold text-white mt-0.5">
                                                {calcResult.consumption} {calcTab === 'electricity' ? 'kWh' : 'm³'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-[#94A3B8]">
                                        <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-[#10B981]" /> Accurate and ready to send to tenants</span>
                                        <span className="font-semibold text-white">Nearest Shilling Rounded</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Value Proposition Section ── */}
            <section id="features" className="py-20 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="max-w-2xl text-left space-y-3">
                        <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Built for Property Owners</p>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Easy Management, Clear Bookkeeping</h2>
                        <p className="text-[#64748B] text-xs lg:text-sm leading-relaxed">
                            Stop chasing tenants for rent and writing down utility bills by hand. KodiPay helps you send reminders, track rent payments, and manage your properties from a single, simple dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard 
                            icon={<Landmark size={18} />} 
                            title="Simple Bookkeeping" 
                            desc="See all your rent collections, income, and expenses in one clear view. No more errors or lost records."
                        />
                        <FeatureCard 
                            icon={<Smartphone size={18} />} 
                            title="Automatic Reminders" 
                            desc="Send rent bills and reminders to your tenants automatically via SMS. Tenants can pay easily and quickly."
                        />
                        <FeatureCard 
                            icon={<Zap size={18} />} 
                            title="Easy Bill Calculation" 
                            desc="Calculate electricity and water bills automatically. Rounding to the nearest shilling makes bills clear for your tenants."
                        />
                        <FeatureCard 
                            icon={<ShieldCheck size={18} />} 
                            title="My Team" 
                            desc="Assign properties to your agents, track their collections, and manage your entire team easily from your account."
                        />
                    </div>
                </div>
            </section>

            {/* ── Platform Console Showcase ── */}
            <section id="console" className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-xl text-left space-y-3">
                            <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Clear Dashboard Views</p>
                            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Everything You Need in One Place</h2>
                            <p className="text-[#64748B] text-xs leading-relaxed">
                                Look at the simple screens below to see how easy it is to use KodiPay to manage your rentals and team.
                            </p>
                        </div>
                        <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] self-start md:self-auto shrink-0">
                            <button 
                                onClick={() => setActiveTab('ledgers')}
                                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'ledgers' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                            >Rent Collections</button>
                            <button 
                                onClick={() => setActiveTab('utilities')}
                                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'utilities' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                            >Utility Bills</button>
                            <button 
                                onClick={() => setActiveTab('agents')}
                                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'agents' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                            >My Agents</button>
                        </div>
                    </div>

                    {/* Interactive UI Mockup Card */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden min-h-[400px] flex flex-col justify-between">
                        {/* Browser Topbar Mockup */}
                        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                                <div className="h-5 px-3 bg-white border border-[#E2E8F0] rounded ml-4 text-[10px] text-[#64748B] flex items-center font-mono w-64 select-none">
                                    https://kodipay.com/dashboard
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Simple Preview</span>
                        </div>

                        {/* Interactive Screen Body */}
                        <div className="p-8 flex-1">
                            {activeTab === 'ledgers' && (
                                <div className="space-y-6 animate-fade-in text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Rent Collected This Month</p>
                                            <p className="text-2xl font-bold text-[#16A34A]">KES 1,006,000</p>
                                        </div>
                                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Expected Rent</p>
                                            <p className="text-2xl font-bold text-[#0F172A]">KES 334,223</p>
                                        </div>
                                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Unpaid Rent Balance</p>
                                            <p className="text-2xl font-bold text-[#D97706]">KES 248,023</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Recent Payments</h4>
                                        <div className="divide-y divide-[#E2E8F0]">
                                            <div className="py-2.5 flex items-center justify-between text-xs font-medium">
                                                <span className="text-[#0F172A]">edward hiuhu</span>
                                                <span className="font-semibold text-emerald-600">KES 1,000,000</span>
                                                <span className="font-mono text-[#64748B] text-[10px]">BANK_TRANSFER</span>
                                            </div>
                                            <div className="py-2.5 flex items-center justify-between text-xs font-medium">
                                                <span className="text-[#0F172A]">EDD</span>
                                                <span className="font-semibold text-emerald-600">KES 2,000</span>
                                                <span className="font-mono text-[#64748B] text-[10px]">MPESA_MANUAL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'utilities' && (
                                <div className="space-y-6 animate-fade-in text-left">
                                    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                    <th className="p-3 font-bold uppercase text-[9px] tracking-wider text-[#64748B]">Unit</th>
                                                    <th className="p-3 font-bold uppercase text-[9px] tracking-wider text-[#64748B]">Previous Meter</th>
                                                    <th className="p-3 font-bold uppercase text-[9px] tracking-wider text-[#64748B]">Current Meter</th>
                                                    <th className="p-3 font-bold uppercase text-[9px] tracking-wider text-[#64748B] text-right">Total Bill</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F1F5F9]">
                                                <tr>
                                                    <td className="p-3 font-bold text-[#0F172A]">Unit 1 (kk hiuhu)</td>
                                                    <td className="p-3 text-[#64748B]">0 kWh</td>
                                                    <td className="p-3 text-[#0F172A] font-medium">2.3 kWh</td>
                                                    <td className="p-3 text-right font-bold text-[#0F172A]">KES 28</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 font-bold text-[#0F172A]">Q1 (Vacant)</td>
                                                    <td className="p-3 text-[#64748B]">0 kWh</td>
                                                    <td className="p-3 text-[#0F172A] font-medium">0 kWh</td>
                                                    <td className="p-3 text-right font-bold text-[#64748B]">KES 0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'agents' && (
                                <div className="space-y-6 animate-fade-in text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded bg-[#F0F6FF] text-[#007AFF] flex items-center justify-center font-bold">EH</div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#0F172A]">Edward Hiuhu</p>
                                                    <p className="text-[10px] text-[#64748B]">Lead Agent</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t border-[#F1F5F9] text-xs">
                                                <div className="flex justify-between"><span className="text-[#64748B]">Assigned Properties</span><span className="font-bold text-[#0F172A]">4 Properties</span></div>
                                                <div className="flex justify-between"><span className="text-[#64748B]">Collection Rate</span><span className="font-bold text-emerald-600">98.4%</span></div>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center font-bold">AM</div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#0F172A]">Angela Mwangi</p>
                                                    <p className="text-[10px] text-[#64748B]">Agent</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t border-[#F1F5F9] text-xs">
                                                <div className="flex justify-between"><span className="text-[#64748B]">Assigned Properties</span><span className="font-bold text-[#0F172A]">2 Properties</span></div>
                                                <div className="flex justify-between"><span className="text-[#64748B]">Collection Rate</span><span className="font-bold text-[#007AFF]">92.1%</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Banner bottom */}
                        <div className="bg-[#0F172A] p-4 text-center text-xs text-white flex items-center justify-center gap-2">
                            <span>Ready to simplify your property management?</span>
                            <Link href="/signup" className="text-[#007AFF] font-bold hover:underline flex items-center gap-0.5">
                                Create your free account today <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Integrations Section ── */}
            <section id="integrations" className="py-20 px-6 lg:px-12 bg-white border-t border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-xl text-left space-y-3">
                            <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Enterprise Connectivity</p>
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Seamless System Integrations</h2>
                            <p className="text-[#64748B] text-xs leading-relaxed">
                                Automate your property business by linking KodiPay with mobile wallets, bank accounts, and field devices.
                            </p>
                        </div>
                        <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] self-start md:self-auto shrink-0">
                            <button 
                                onClick={() => { setIntegrationTab('payments'); setExpandedGuide(null); }}
                                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${integrationTab === 'payments' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                            >Payments Automation</button>
                            <button 
                                onClick={() => { setIntegrationTab('bills'); setExpandedGuide(null); }}
                                className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${integrationTab === 'bills' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                            >Utility Bill Collection</button>
                        </div>
                    </div>

                    {integrationTab === 'payments' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Card 1: Bank API */}
                            <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left ${expandedGuide === 'bank' ? 'border-[#007AFF]' : 'border-[#E2E8F0]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#007AFF] flex items-center justify-center mb-4">
                                    <Landmark size={20} />
                                </div>
                                <h3 className="font-extrabold text-sm text-[#0F172A] tracking-tight">Bank API Integrations</h3>
                                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                                    Link your commercial bank accounts directly with KodiPay to automatically track and match tenant bank transfers in real-time.
                                </p>
                                <button 
                                    onClick={() => setExpandedGuide(expandedGuide === 'bank' ? null : 'bank')}
                                    className="text-[#007AFF] text-xs font-bold mt-4 hover:underline flex items-center gap-1 focus:outline-none"
                                >
                                    {expandedGuide === 'bank' ? 'Hide Integration Guide' : 'How to Set Up'} <ChevronRight size={14} className={`transform transition-transform ${expandedGuide === 'bank' ? 'rotate-90' : ''}`} />
                                </button>

                                {expandedGuide === 'bank' && (
                                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-3 animate-fade-in">
                                        <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Step-by-Step Setup Guide</h4>
                                        <div className="space-y-2 text-xs text-[#475569]">
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                                                <p>Contact your corporate banking representative (Equity, KCB, Co-op, etc.) to request API/Webhook integration.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                                                <p>KodiPay will generate a unique Bank Webhook URL (e.g., <code className="bg-[#F8FAFC] px-1 py-0.5 border rounded font-mono text-[10px] text-[#007AFF]">https://api.kodipay.com/v1/webhooks/bank</code>).</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                                                <p>Provide this Webhook URL to your bank so they can configure transaction push alerts to KodiPay.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                                                <p>Save your bank API keys in the KodiPay dashboard to enable secure decryption and instant matching.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card 2: M-Pesa API */}
                            <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left ${expandedGuide === 'mpesa' ? 'border-[#007AFF]' : 'border-[#E2E8F0]'}`}>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                                    <Network size={20} />
                                </div>
                                <h3 className="font-extrabold text-sm text-[#0F172A] tracking-tight">M-Pesa API Integration</h3>
                                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                                    Connect your M-Pesa C2B Paybill or Till number directly via Safaricom Daraja API for fully automated reconciliation.
                                </p>
                                <button 
                                    onClick={() => setExpandedGuide(expandedGuide === 'mpesa' ? null : 'mpesa')}
                                    className="text-[#007AFF] text-xs font-bold mt-4 hover:underline flex items-center gap-1 focus:outline-none"
                                >
                                    {expandedGuide === 'mpesa' ? 'Hide Integration Guide' : 'How to Set Up'} <ChevronRight size={14} className={`transform transition-transform ${expandedGuide === 'mpesa' ? 'rotate-90' : ''}`} />
                                </button>

                                {expandedGuide === 'mpesa' && (
                                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-3 animate-fade-in">
                                        <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Step-by-Step Setup Guide</h4>
                                        <div className="space-y-2 text-xs text-[#475569]">
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                                                <p>Register or log in on the official <strong>Safaricom Daraja Developer Portal</strong>.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                                                <p>Create a new App on Daraja to get your <strong>Consumer Key</strong>, <strong>Consumer Secret</strong>, and <strong>Passkey</strong>.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                                                <p>Enter these details in KodiPay under <strong>Settings → Integrations → M-Pesa</strong>.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                                                <p>Click "Initialize Webhook" inside KodiPay. Payments are now tracked and credited automatically!</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card 3: SMS Forwarder */}
                            <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left ${expandedGuide === 'sms' ? 'border-[#007AFF]' : 'border-[#E2E8F0]'} flex flex-col justify-between`}>
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4">
                                        <Smartphone size={20} />
                                    </div>
                                    <h3 className="font-extrabold text-sm text-[#0F172A] tracking-tight">Automatic M-Pesa SMS Forwarding</h3>
                                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                                        Using personal Till numbers or standard SIM lines? Our Android SMS Forwarder app forwards transaction SMS to KodiPay servers.
                                    </p>
                                    <button 
                                        onClick={() => setExpandedGuide(expandedGuide === 'sms' ? null : 'sms')}
                                        className="text-[#007AFF] text-xs font-bold mt-4 hover:underline flex items-center gap-1 focus:outline-none"
                                    >
                                        {expandedGuide === 'sms' ? 'Hide Integration Guide' : 'How to Set Up'} <ChevronRight size={14} className={`transform transition-transform ${expandedGuide === 'sms' ? 'rotate-90' : ''}`} />
                                    </button>

                                    {expandedGuide === 'sms' && (
                                        <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-3 animate-fade-in">
                                            <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Step-by-Step Setup Guide</h4>
                                            <div className="space-y-2 text-xs text-[#475569]">
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                                                    <p>Download and install our APK on the Android phone that receives the payment SMS notifications.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                                                    <p>Open the app and log in securely using the <strong>One-Time Password (OTP)</strong> sent to your registered number.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                                                    <p>Grant the necessary SMS read permissions to allow automated packet forwarding.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                                                    <p>Keep the app active in the background. Payments will post on your ledger inside 3 seconds!</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
                                    <a 
                                        href="/downloads/sms-forwarder.apk" 
                                        download
                                        className="w-full h-10 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none"
                                    >
                                        <Download size={14} /> Download Forwarder App
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm text-left flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#007AFF] flex items-center justify-center shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <h3 className="font-extrabold text-base text-[#0F172A] tracking-tight">KodiPay Utility Bills Collection App</h3>
                                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                                        Empower your field agents with our offline-first utility billing app. Record water and electricity meter readings on the spot, compute bills instantly based on tiered schedules, and sync when online.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        onClick={() => setExpandedGuide(expandedGuide === 'bills' ? null : 'bills')}
                                        className="text-[#007AFF] text-xs font-bold hover:underline flex items-center gap-1 focus:outline-none"
                                    >
                                        {expandedGuide === 'bills' ? 'Hide Integration Guide' : 'How to Set Up'} <ChevronRight size={14} className={`transform transition-transform ${expandedGuide === 'bills' ? 'rotate-90' : ''}`} />
                                    </button>

                                    {expandedGuide === 'bills' && (
                                        <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-3 animate-fade-in">
                                            <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Step-by-Step Setup Guide</h4>
                                            <div className="space-y-2 text-xs text-[#475569]">
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                                                    <p>Download and install the **KodiPay Bills App** onto your team's Android field devices.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                                                    <p>Log in using your registered Landlord or Agent dashboard credentials.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                                                    <p>Walk around the property, select a unit, and type the current meter reading. The app automatically calculates rates offline.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                                                    <p>Click "Submit & Sync" to upload the bills to the server and instantly send SMS invoices to your tenants.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <a 
                                        href="/downloads/kodipay-bills.apk" 
                                        download
                                        className="inline-flex h-11 px-6 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg items-center gap-2 transition-colors shadow-sm focus:outline-none"
                                    >
                                        <Download size={14} /> Download Utility Bills App
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Transparent Pricing Section ── */}
            <section id="pricing" className="py-20 px-6 lg:px-12 bg-white border-t border-[#E2E8F0]">
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
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                            <Building2 size={16} />
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

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:border-[#007AFF] transition-all duration-300 hover:shadow-md text-left">
            <div className="w-9 h-9 rounded-lg bg-[#F0F6FF] border border-[#D9E9FF] text-[#007AFF] flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">{title}</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2">{desc}</p>
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
