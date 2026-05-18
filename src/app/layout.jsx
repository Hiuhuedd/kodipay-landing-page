import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';
import { HelpButton } from '@/components/ui';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata = {
    title: 'KodiPay - Property Management',
    description: 'Manage your rental properties, tenants, and payments',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen antialiased bg-[#F8FAFC]">
                <AuthProvider>
                    {children}
                    <HelpButton />
                </AuthProvider>
            </body>
        </html>
    );
}

