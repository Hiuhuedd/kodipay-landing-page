'use client';

import { useState } from 'react';
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
    { href: '/dashboard/reports/monthly', icon: Calendar, label: 'Monthly Report' },
    { href: '/dashboard/reports/portfolio', icon: PieChart, label: 'Portfolio Report' },
    { section: 'Administration' },
    { href: '/dashboard/staff', icon: ShieldCheck, label: 'Staff Management', adminOnly: true },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing & SMS', adminOnly: true },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const { logout, user } = useAuth();
    const isAdmin = user?.role === 'admin';

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

            {/* Footer */}
            <div className="border-t border-[#E2E8F0] p-3 bg-[#F8FAFC]/50 overflow-hidden">
                <div className="flex items-center gap-3 min-w-max px-1">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-sm font-semibold text-[#0F172A] shrink-0 shadow-sm">
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                            {user?.name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-[#64748B] truncate uppercase tracking-widest font-medium">
                            {user?.role || 'User'}
                        </p>
                    </div>
                    {isExpanded && (
                        <button
                            onClick={handleLogout}
                            className="p-2 text-[#94A3B8] hover:text-[#DC2626] transition-colors shrink-0"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
