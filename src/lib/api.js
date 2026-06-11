// ============================================
// KodiPay Web – Centralised API Utility
// ============================================
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ── Core fetch helper ──────────────────────────────────────────────────────
export async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const res = await fetch(url, {
            headers,
            ...options,
        });
        if (!res.ok) {
            let errMsg = `API Error ${res.status}: ${res.statusText}`;
            try {
                const errData = await res.json();
                if (errData && errData.error) {
                    if (typeof errData.error === 'string') {
                        errMsg = errData.error;
                    } else if (typeof errData.error === 'object') {
                        const m = errData.error.message;
                        if (typeof m === 'string') {
                            errMsg = m;
                        } else if (m && typeof m === 'object') {
                            errMsg = m.errorMessage || m.message || JSON.stringify(m);
                        } else {
                            errMsg = errData.error.code || errMsg;
                        }
                    }
                }
            } catch (_) {}
            throw new Error(errMsg);
        }
        return await res.json();
    } catch (err) {
        console.warn(`[API] ${endpoint} failed:`, err.message || err);
        throw err;
    }
}

// ── Stats ─────────────────────────────────────────────────────────────────
export const getStats = (month, propertyIds = null) => {
    let url = `/stats${month ? `?month=${month}` : ''}`;
    if (propertyIds !== null) {
        url += `${month ? '&' : '?'}propertyIds=${propertyIds.join(',')}`;
    }
    return fetchAPI(url);
};

// ── Properties ───────────────────────────────────────────────────────────
export const getProperties = () => fetchAPI('/properties');
export const getPropertyById = (id) => fetchAPI(`/properties/${id}`);
export const createProperty = (data) =>
    fetchAPI('/properties', { method: 'POST', body: JSON.stringify(data) });
export const updateProperty = (id, data) =>
    fetchAPI(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProperty = (id) =>
    fetchAPI(`/properties/${id}`, { method: 'DELETE' });
export const updateUnit = (propertyId, unitId, data) =>
    fetchAPI(`/properties/${propertyId}/units/${unitId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

// ── Tenants ───────────────────────────────────────────────────────────────
export const getTenants = () => fetchAPI('/tenants');
export const getTenantById = (id) => fetchAPI(`/tenants/${id}`);
export const createTenant = (data) =>
    fetchAPI('/tenants', { method: 'POST', body: JSON.stringify(data) });
export const updateTenant = (id, data) =>
    fetchAPI(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTenant = (id) =>
    fetchAPI(`/tenants/${id}`, { method: 'DELETE' });
export const getPaymentStatus = (id) =>
    fetchAPI(`/tenants/${id}/payment-status`);
export const applyPenalty = (id, sendSMS = true) =>
    fetchAPI(`/tenants/${id}/apply-penalty`, { method: 'POST', body: JSON.stringify({ sendSMS }) });
export const removePenalty = (id) =>
    fetchAPI(`/tenants/${id}/remove-penalty`, { method: 'POST' });

// ── Payments ─────────────────────────────────────────────────────────────
export const getMonthlyReport = (month, propertyIds = null) => {
    let url = `/payments/monthly-report${month ? `?month=${month}` : ''}`;
    if (propertyIds !== null) {
        url += `${month ? '&' : '?'}propertyIds=${propertyIds.join(',')}`;
    }
    return fetchAPI(url);
};
export const getOverduePayments = (month) => fetchAPI(`/payments/overdue${month ? `?month=${month}` : ''}`);
export const getTransactions = (month) => getMonthlyReport(month);
export const sendReminders = (tenantIds = null, month = null) => {
    const body = JSON.stringify({
        tenantIds,
        month: month || getCurrentMonth()
    });
    return fetchAPI('/payments/send-reminders', { method: 'POST', body });
};
export const processManualPayment = (data) =>
    fetchAPI('/payments/manual', { method: 'POST', body: JSON.stringify(data) });

// ── Reports ───────────────────────────────────────────────────────────────
export const getPropertyReport = (propertyId, month) =>
    fetchAPI(`/reports/property/${propertyId}/month/${month}`);
export const downloadPropertyReportPdf = (propertyId, month) =>
    `${API_BASE_URL}/reports/property/${propertyId}/month/${month}/pdf`;
export const downloadPortfolioReportPdf = (month) =>
    `${API_BASE_URL}/reports/portfolio/month/${month}/pdf`;
export const getTenantStatement = (tenantId) =>
    fetchAPI(`/reports/tenant/${tenantId}`);
export const downloadTenantStatementPdf = (tenantId) =>
    `${API_BASE_URL}/reports/tenant/${tenantId}/pdf`;

// ── Running Costs ─────────────────────────────────────────────────────────
export const getRunningCosts = (propertyId, month) =>
    fetchAPI(
        `/running-costs/property/${propertyId}${month ? `/month/${month}` : ''}`
    );
export const addRunningCost = (data) =>
    fetchAPI('/running-costs', { method: 'POST', body: JSON.stringify(data) });
export const addRunningCostsBatch = (data) =>
    fetchAPI('/running-costs/batch', { method: 'POST', body: JSON.stringify(data) });
export const deleteRunningCost = (id) =>
    fetchAPI(`/running-costs/${id}`, { method: 'DELETE' });

// ── Electricity Bills ───────────────────────────────────────────────────
export const getElectricityBills = (propertyId) =>
    fetchAPI(`/electricity-bills/${propertyId}`);
export const saveElectricityBills = (propertyId, data) =>
    fetchAPI(`/electricity-bills/${propertyId}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

// ── Water Bills ───────────────────────────────────────────────────────────
export const getWaterBills = (propertyId) =>
    fetchAPI(`/water-bills/${propertyId}`);
export const saveWaterBills = (propertyId, data) =>
    fetchAPI(`/water-bills/${propertyId}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const getWaterBillHistory = (propertyId) =>
    fetchAPI(`/water-bills/${propertyId}/history`);

// ── Settings ─────────────────────────────────────────────────────────────
export const getSettings = () => fetchAPI('/settings');
export const updateSettings = (data) =>
    fetchAPI('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const registerMpesaWebhooks = () =>
    fetchAPI('/settings/register-mpesa', { method: 'POST' });

// ── Admin & Subagents ────────────────────────────────────────────────────
export const getSubagents = () => fetchAPI('/admin/subagents');
export const createSubagent = (data) =>
    fetchAPI('/admin/subagents', { method: 'POST', body: JSON.stringify(data) });
export const assignProperty = (subagentUid, propertyId) =>
    fetchAPI('/admin/subagents/assign', { method: 'POST', body: JSON.stringify({ subagentUid, propertyId }) });
export const unassignProperty = (subagentUid, propertyId) =>
    fetchAPI('/admin/subagents/unassign', { method: 'POST', body: JSON.stringify({ subagentUid, propertyId }) });
export const getStaffPerformance = (month) =>
    fetchAPI(`/admin/staff-performance${month ? `?month=${month}` : ''}`);

// ── Billing & SMS Plans ──────────────────────────────────────────────────
export const getSmsUsage = () => fetchAPI('/billing/sms-usage');
export const purchaseSmsPlan = (planId, units) =>
    fetchAPI('/billing/purchase-plan', { method: 'POST', body: JSON.stringify({ planId, units }) });
export const initiateMpesaStk = (data) =>
    fetchAPI('/billing/mpesa-stk', { method: 'POST', body: JSON.stringify(data) });
export const pollStkStatus = (checkoutRequestId) =>
    fetchAPI(`/billing/stk-status/${encodeURIComponent(checkoutRequestId)}`);

// ── Auth ─────────────────────────────────────────────────────────────────
export const sendVerification = (email, phone) =>
    fetchAPI('/auth/send-verification', { method: 'POST', body: JSON.stringify({ email, phone }) });

export const verifyOtp = (email, phone, otp) =>
    fetchAPI('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, phone, otp }) });

export const completeSignup = (data) =>
    fetchAPI('/auth/complete-signup', { method: 'POST', body: JSON.stringify(data) });

// ── Profile ──────────────────────────────────────────────────────────────
export const getUserProfile = () => fetchAPI('/users/profile');
export const updateUserProfile = (data) =>
    fetchAPI('/users/profile', { method: 'PUT', body: JSON.stringify(data) });

// ── Helpers ───────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
    return `KES ${Math.round(Number(amount || 0)).toLocaleString('en-KE')}`;
}

export function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function statusColor(status = '') {
    const s = status.toLowerCase();
    if (s === 'paid') return 'paid';
    if (s === 'partial') return 'partial';
    return 'unpaid';
}

// ── Demo Requests ────────────────────────────────────────────────────────
export const submitDemoRequest = (data) =>
    fetchAPI('/superadmin/demo-requests', { method: 'POST', body: JSON.stringify(data) });
export const getDemoRequests = () => fetchAPI('/superadmin/demo-requests');
export const updateDemoRequestStatus = (id, status) =>
    fetchAPI(`/superadmin/demo-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const sendTestSms = (phone, message) =>
    fetchAPI('/superadmin/test-sms', { method: 'POST', body: JSON.stringify({ phone, message }) });
