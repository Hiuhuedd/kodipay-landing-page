// API Configuration - Same as mobile app
export const API_BASE_URL = 'https://rent-manager-server.onrender.com/api';

export const API_ENDPOINTS = {
    // Stats
    STATS: '/stats',

    // Properties
    PROPERTIES: '/properties',
    PROPERTY_BY_ID: (id) => `/properties/${id}`,

    // Tenants
    TENANTS: '/tenants',
    TENANT_BY_ID: (id) => `/tenants/${id}`,

    // Payments
    PAYMENTS: '/payments',
    MONTHLY_REPORT: '/payments/monthly-report',
    OVERDUE_PAYMENTS: '/payments/overdue',

    // Wallet
    WALLET: '/wallet',
    WITHDRAW: '/wallet/withdraw',
    OVERDRAFT: '/wallet/overdraft',
    LOANS: '/wallet/loans',
};

// Fetch helper
export async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        throw error;
    }
}

// Format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0
    }).format(amount || 0);
}

// Get current month in YYYY-MM format
export function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}
