'use client';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, LogOut, PhoneCall } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    
    // Check if the agency status is suspended
    const isSuspended = user?.agencyStatus === 'suspended';

    if (isSuspended) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
                {/* Background light gradients */}
                <div className="absolute right-0 top-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <ShieldAlert size={32} />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-black uppercase tracking-wider text-red-500">Account Suspended</h2>
                        <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                            Your agency's administrative account has been suspended by KodiPay Operations. Access to your portals, database registers, and SMS dispatches has been temporarily restricted.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-left">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next Steps</p>
                        <p className="text-xs font-semibold text-slate-300">1. Clear any pending outstanding subscription dues.</p>
                        <p className="text-xs font-semibold text-slate-300">2. Verify that your operations comply with our terms.</p>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <a 
                            href="tel:0743466032" 
                            className="h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                            <PhoneCall size={14} /> Contact Support
                        </a>
                        <button 
                            onClick={logout}
                            className="h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <TopBar />
                <div className="p-4 md:p-6 space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

