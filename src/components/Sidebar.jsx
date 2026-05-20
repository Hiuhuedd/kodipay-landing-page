'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Receipt,
    Droplets,
    Calendar,
    PieChart,
    Bell,
    Settings,
    LogOut,
    ShieldCheck,
    Zap,
    User,
    UserCheck,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { section: 'Properties & Tenants' },
    { href: '/dashboard/properties', icon: Building2, label: 'Properties' },
    { href: '/dashboard/tenants', icon: Users, label: 'Tenants' },
    { href: '/dashboard/clients', icon: UserCheck, label: 'Client Management' },
    { href: '/dashboard/reminders', icon: Bell, label: 'Send Reminders' },
    { section: 'Finances' },
    { href: '/dashboard/transactions', icon: CreditCard, label: 'Transactions' },
    { href: '/dashboard/running-costs', icon: Receipt, label: 'Running Costs' },
    { href: '/dashboard/water-bills', icon: Droplets, label: 'Water Bills' },
    { href: '/dashboard/electricity-bills', icon: Zap, label: 'Electricity Bills' },
    { section: 'Reports' },
    { href: '/dashboard/reports/portfolio', icon: PieChart, label: 'Portfolio Report' },
    { href: '/dashboard/reports/monthly', icon: Calendar, label: 'Monthly Report' },
    { href: '/dashboard/reports/tenant', icon: Users, label: 'Tenant Statement' },
    { href: '/dashboard/reports/client', icon: UserCheck, label: 'Client Report' },
    { section: 'Administration' },
    { href: '/dashboard/staff', icon: ShieldCheck, label: 'Staff Management', adminOnly: true },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing & SMS', adminOnly: true },
    { href: '/dashboard/demo-requests', icon: Users, label: 'Demo Requests', adminOnly: true },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const walkthroughTips = [
    {
        path: '/dashboard',
        title: 'Dashboard Overview',
        icon: LayoutDashboard,
        steps: [
            'Monitor total collections, unpaid rent, and active utility meters.',
            'Review real-time financial stats and monthly aggregate growth graphs.',
            'Access superadmin billing tier configuration options directly.'
        ]
    },
    {
        path: '/dashboard/properties',
        title: 'Properties Setup',
        icon: Building2,
        steps: [
            'Create physical buildings/estates by clicking "Add Property".',
            'Define distinct rental units, monthly pricing rates, and details.',
            'Track utility meter indices per tenant inside each property.'
        ]
    },
    {
        path: '/dashboard/tenants',
        title: 'Tenants Directory',
        icon: Users,
        steps: [
            'Click "Onboard Tenant" to allocate occupants to active vacant units.',
            'Set contract start dates, deposits paid, and contact details.',
            'Configure tenant custom utility override variables (optional).'
        ]
    },
    {
        path: '/dashboard/clients',
        title: 'Client Management',
        icon: UserCheck,
        steps: [
            'Create third-party agency sub-accounts for delegated monitoring.',
            'Define custom billing frequencies and system limits.',
            'Oversee independent platform activity streams.'
        ]
    },
    {
        path: '/dashboard/reminders',
        title: 'SMS Reminders',
        icon: Bell,
        steps: [
            'Select target properties or specific units with due balances.',
            'Review the prepared SMS alert text with dynamic balance tags.',
            'Click "Send Statement" to trigger direct payment prompts via SMS.'
        ]
    },
    {
        path: '/dashboard/transactions',
        title: 'Transactions Ledger',
        icon: CreditCard,
        steps: [
            'Review real-time payment notifications (M-Pesa, Cash, Bank).',
            'Select any record to view payment receipts and audit details.',
            'Click "Record Manual Payment" for offline collections.'
        ]
    },
    {
        path: '/dashboard/running-costs',
        title: 'Running Costs',
        icon: Receipt,
        steps: [
            'Log new physical maintenance bills, fees, and operations.',
            'Categorize costs (Repairs, Utilities, Taxes) to track overheads.',
            'Filter expenditures by property or monthly periods.'
        ]
    },
    {
        path: '/dashboard/water-bills',
        title: 'Water Utilities',
        icon: Droplets,
        steps: [
            'Record the current water meter index for occupied rooms.',
            'System multiplies consumption by rate (KES 135/unit) + fee.',
            'Post generated charges directly to the tenant statement.'
        ]
    },
    {
        path: '/dashboard/electricity-bills',
        title: 'Electricity Utilities',
        icon: Zap,
        steps: [
            'Input previous and current kWh meter numbers for each unit.',
            'KodiPay automates tiered power rate logic instantly.',
            'Generate clean digital power receipts ready to send.'
        ]
    },
    {
        path: '/dashboard/reports/portfolio',
        title: 'Portfolio Reports',
        icon: PieChart,
        steps: [
            'Generate dynamic landlord payout sheets and statements.',
            'Review unpaid arrears rosters and total collected rents.',
            'Export tax audits and financial data tables to PDF files.'
        ]
    },
    {
        path: '/dashboard/reports/monthly',
        title: 'Monthly Reports',
        icon: Calendar,
        steps: [
            'Verify collection history across specific rental intervals.',
            'Audit agent performance levels and collections success rates.',
            'Calculate net profits after operational expenditures.'
        ]
    },
    {
        path: '/dashboard/reports/tenant',
        title: 'Tenant Statements',
        icon: Users,
        steps: [
            'Produce detailed billing invoice audit charts per occupant.',
            'Audit outstanding credit balances or prepayments.',
            'Send custom PDF statements directly to the tenant.'
        ]
    },
    {
        path: '/dashboard/staff',
        title: 'Staff Management',
        icon: ShieldCheck,
        steps: [
            'Add management agents and assign specific property clusters.',
            'Audits real-time collection rates and performance indexes.',
            'Disable active staff logins instantly when required.'
        ]
    },
    {
        path: '/dashboard/billing',
        title: 'Billing & SMS Quotas',
        icon: CreditCard,
        steps: [
            'Track monthly message consumption against system limits.',
            'Buy one-time bulk SMS packages (A-la-carte bundles).',
            'Upgrade workspace licenses (Starter, Growth, Pro) dynamically.'
        ]
    },
    {
        path: '/dashboard/settings',
        title: 'Settings Board',
        icon: Settings,
        steps: [
            'Update company legal name, contact numbers, and headers.',
            'Configure default billing due dates and automated penalty rates.',
            'Draft global template messages for payment reminders.'
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const { logout, user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [dismissed, setDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kp_walkthrough_dismissed') === 'true';
        }
        return false;
    });

    const [tipIndex, setTipIndex] = useState(-1);

    // Dynamic guide tracking that updates on page change
    const activeTip = tipIndex !== -1 
        ? walkthroughTips[tipIndex]
        : (walkthroughTips.find(tip => 
            tip.path === pathname || 
            (tip.path !== '/dashboard' && pathname?.startsWith(tip.path))
        ) || walkthroughTips[0]);

    useEffect(() => {
        setTipIndex(-1);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
        router.push('/signin');
    };

    return (
        <aside 
            className={`hidden lg:flex flex-col h-full bg-white border-r border-[#E2E8F0] z-50 transition-all duration-300 ease-in-out shrink-0 ${isExpanded ? 'w-64' : 'w-[72px]'}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Brand */}
            <div className="h-14 flex items-center px-[22px] border-b border-[#E2E8F0] shrink-0 overflow-hidden">
                <div className="flex items-center gap-4 min-w-max">
                    <div className="w-7 h-7 bg-[#007AFF] rounded flex items-center justify-center shrink-0">
                        <span className="text-white text-[13px] font-bold">K</span>
                    </div>
                    <span className={`text-[15px] font-semibold text-[#0F172A] tracking-tight transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        KodiPay
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1 hide-scrollbar overflow-x-hidden">
                {navItems.map((item, i) => {
                    if (item.section) {
                        if (item.section === 'Administration' && !isAdmin) return null;
                        return (
                            <div 
                                key={i} 
                                className={`px-[22px] overflow-hidden flex items-center transition-all duration-300 ease-in-out ${
                                    isExpanded ? 'pt-4 mb-1 h-8 opacity-100' : 'pt-0 mb-0 h-0 opacity-0 pointer-events-none'
                                }`}
                            >
                                <span className={`text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                                    {item.section}
                                </span>
                            </div>
                        );
                    }

                    if (item.adminOnly && !isAdmin) return null;

                    const Icon = item.icon;
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname?.startsWith(item.href);

                    return (
                        <div key={item.href} className="px-3">
                            <Link
                                href={item.href}
                                title={!isExpanded ? item.label : ''}
                                className={`flex items-center gap-4 px-[10px] py-2 rounded-md transition-all relative group ${
                                    isActive 
                                    ? 'text-[#007AFF] bg-blue-50 font-medium' 
                                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <div className="shrink-0 w-7 flex justify-center">
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[13px] font-medium whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                                    {item.label}
                                </span>
                                
                                {!isExpanded && isActive && (
                                    <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-[#007AFF] rounded-r-full" />
                                )}
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Walkthrough Helper Tips Box */}
            {isExpanded && !dismissed && activeTip && (
                <div className="mx-3 my-2 p-3.5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-lg border border-slate-800 animate-in slide-in-from-bottom-2 duration-300 relative shrink-0">
                    <button
                        onClick={() => {
                            setDismissed(true);
                            localStorage.setItem('kp_walkthrough_dismissed', 'true');
                        }}
                        className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-[9px] font-bold outline-none"
                        title="Hide walkthrough guide"
                    >
                        ✕
                    </button>
                    
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-amber-400">
                            {(() => {
                                const TipIcon = activeTip.icon;
                                return <TipIcon size={12} />;
                            })()}
                        </div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                            {activeTip.title}
                        </h4>
                    </div>

                    <div className="space-y-1.5 mt-1">
                        {activeTip.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-2 text-left">
                                <span className="text-[9px] text-amber-400 shrink-0 font-extrabold">•</span>
                                <p className="text-[9.5px] font-bold text-slate-400 leading-normal">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            Quick Tip
                        </span>
                        <button
                            onClick={() => {
                                const currentIndex = walkthroughTips.findIndex(t => t.path === activeTip.path);
                                const nextIndex = (currentIndex + 1) % walkthroughTips.length;
                                setTipIndex(nextIndex);
                                router.push(walkthroughTips[nextIndex].path);
                            }}
                            className="text-[8px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-0.5"
                        >
                            Next Page <ChevronRight size={10} />
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="border-t border-[#E2E8F0] p-3 bg-[#F8FAFC]/50 overflow-hidden shrink-0">
                <div className="flex items-center gap-3 min-w-max px-1">
                    <button
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-sm font-semibold text-[#0F172A] shrink-0 shadow-sm hover:border-[#007AFF] transition-colors outline-none"
                        title="View Profile"
                    >
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </button>
                    <div className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                            {user?.name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate uppercase tracking-widest font-medium">
                            {user?.role || 'User'}
                        </p>
                    </div>
                    {isExpanded && (
                        <>
                            {dismissed && (
                                <button
                                    onClick={() => {
                                        setDismissed(false);
                                        localStorage.removeItem('kp_walkthrough_dismissed');
                                    }}
                                    className="mr-1 text-[9px] font-black text-sky-600 hover:text-sky-500 transition-colors uppercase tracking-wider shrink-0 border border-sky-100 px-2 py-0.5 rounded bg-sky-50/50 outline-none"
                                    title="Restore walkthrough tips"
                                >
                                    Tips
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-[#94A3B8] hover:text-[#DC2626] transition-colors shrink-0 outline-none"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    )}
                </div>
                {!isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0]/80 flex justify-center">
                        <button
                            onClick={handleLogout}
                            className="p-2 text-[#94A3B8] hover:text-[#DC2626] transition-colors shrink-0 rounded-md hover:bg-red-50"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
