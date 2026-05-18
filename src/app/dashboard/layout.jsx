import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function DashboardLayout({ children }) {
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

