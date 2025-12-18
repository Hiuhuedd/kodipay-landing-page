import './globals.css';


export const metadata = {
    title: 'KodiPay - Property Management',
    description: 'Manage your rental properties, tenants, and payments',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="bg-[var(--background)]">
                {children}
            </body>
        </html>
    );
}
