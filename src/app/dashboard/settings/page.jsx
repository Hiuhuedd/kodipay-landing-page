'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings, registerMpesaWebhooks, API_BASE_URL } from '@/lib/api';
import { PageHeader, LoadingPage } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { 
    CreditCard, Building2, Bell, Info, Save, Check, Hash, Phone, Calendar, 
    Clock, Sliders, Globe, AlertTriangle, Sparkles, MessageSquare, AlertCircle, 
    Lock, Mail, Landmark, CheckSquare, Zap, BadgeAlert, Coins,
    Smartphone, Server, ArrowRight, ArrowDown, ShieldCheck, Eye, EyeOff
} from 'lucide-react';

const FieldGroup = ({ label, children, hint, required }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        </div>
        {children}
        {hint && <p className="text-[10px] font-medium text-[#94A3B8]">{hint}</p>}
    </div>
);

const InputCls = "w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-semibold text-[#0F172A] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all text-xs placeholder:font-normal placeholder:text-[#94A3B8]";
const SelectCls = "w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-semibold text-[#0F172A] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all text-xs appearance-none cursor-pointer";
const TextareaCls = "w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-mono text-[11px] text-[#0F172A] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all placeholder:text-[#94A3B8] resize-none h-24";

const MaskedInput = ({ value, onChange, placeholder }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative w-full">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
            <input 
                type={visible ? "text" : "password"}
                className={InputCls}
                placeholder={placeholder || "••••••••••••••••"}
                value={value}
                onChange={onChange}
            />
            <button 
                type="button"
                onClick={() => setVisible(!visible)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
};

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [settings, setSettings] = useState({
        agencyName: 'KodiPay Agency',
        customerServiceNumber: '',
        defaultCurrency: 'KES',
        timezone: 'Africa/Nairobi',
        brandAccent: 'amber',
        rentDueDay: 5,
        
        // Legacy fallback support
        paymentMethod: 'mpesa',
        paybill: '522533',
        
        paymentMethods: {
            mpesaActive: true,
            mpesaType: 'paybill', // 'paybill' or 'till'
            mpesaNumber: '522533',
            mpesaConsumerKey: '',
            mpesaConsumerSecret: '',
            mpesaPasskey: '',
            bankActive: false,
            bankName: 'Equity Bank',
            bankBranch: '',
            bankAccountNumber: '',
            cashActive: true
        },
        
        reminderConfig: {
            dayOfMonth: 15,
            time: '14:00',
            autoSendInvoice: true,
            sendConfirmationSMS: true,
            sendLandlordAutoSplit: true
        },
        
        smsTemplates: {
            rentDue: 'Dear {tenantName}, rent for unit {unitName} is due. Please pay KSh {amount} via Paybill {paybill}. Support: {customerServiceNumber}',
            rentOverdue: 'Dear {tenantName}, rent of KSh {amount} for unit {unitName} is overdue. Please pay immediately to avoid late penalties. Support: {customerServiceNumber}',
            paymentConfirmation: 'Hello {tenantName}, we have received KSh {amount} for unit {unitName}. Thank you!'
        },
        
        penalties: {
            active: false,
            type: 'flat', // 'flat' or 'percent'
            value: '500',
            gracePeriodDays: '5',
            frequency: 'once', // 'once' or 'daily'
            autoInvoice: true
        },
        
        defaultCommissionRate: '10',
        smsQuotaUsed: 520,
        smsQuotaTotal: 2000,
        agencyPlan: 'Enterprise Professional',
        
        integrationTier: 'manual', // 'manual', 'dedicated_mpesa', 'kodipay_paybill'
        mpesaCredentials: {
            consumerKey: '',
            consumerSecret: '',
            passkey: '',
            shortCode: '',
            initiatorName: '',
            securityCredential: ''
        },
        payoutRouting: 'manual', // 'manual', 'auto_split', 'auto_full_to_agency'
        agencyPrefix: ''
    });

    const [activeTab, setActiveTab] = useState('general'); // 'general', 'payments', 'reminders', 'penalties', 'billing'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [registering, setRegistering] = useState(false);

    const getCleanedSettingsForUpdate = () => {
        const cleanedMpesaCredentials = {};
        if (settings.mpesaCredentials) {
            Object.entries(settings.mpesaCredentials).forEach(([key, val]) => {
                if (val !== undefined && val !== null && typeof val === 'string' && val.trim() !== '') {
                    cleanedMpesaCredentials[key] = val.trim();
                }
            });
        }

        const cleanedPaymentMethods = { ...settings.paymentMethods };
        if (cleanedPaymentMethods) {
            Object.entries(cleanedPaymentMethods).forEach(([key, val]) => {
                if (typeof val === 'string' && val.trim() === '') {
                    delete cleanedPaymentMethods[key];
                }
            });
        }

        const updated = {
            ...settings,
            paymentMethod: settings.paymentMethods.mpesaActive ? 'mpesa' : 'cash',
            paybill: settings.paymentMethods.mpesaNumber || '522533',
            mpesaCredentials: cleanedMpesaCredentials,
            paymentMethods: cleanedPaymentMethods
        };

        // Don't send empty credentials object so it doesn't overwrite backend with {}
        if (Object.keys(cleanedMpesaCredentials).length === 0) {
            delete updated.mpesaCredentials;
        }
        
        return updated;
    };

    const handleRegisterWebhooks = async () => {
        const creds = settings.mpesaCredentials;
        if (!creds || !creds.consumerKey || !creds.consumerSecret || !creds.shortCode) {
            alert('Please configure the Consumer Key, Consumer Secret, and Short Code in the form fields first.');
            return;
        }

        setRegistering(true);
        try {
            // First save the current settings so the backend has the latest credentials!
            const updated = getCleanedSettingsForUpdate();
            await updateSettings(updated);
            
            // Now register
            await registerMpesaWebhooks();
            alert('Safaricom Daraja Webhooks Registered Successfully! C2B integration is now fully active.');
        } catch (err) {
            console.error(err);
            alert(`Failed to register webhooks: ${err.message || err}`);
        } finally {
            setRegistering(false);
        }
    };

    const planInfo = {
        starter: { name: 'Starter Portfolio Plan', desc: 'Up to 75 properties limit, optimized for local property developers.' },
        basic: { name: 'Basic Professional Plan', desc: 'Standard automation triggers with multi-property ledger tools.' },
        premium: { name: 'Executive Premium Plan', desc: 'Slick vertical ledger cards with dedicated STK express push access.' },
        enterprise: { name: 'Enterprise Corporate Plan', desc: 'Unlimited portfolios with priority API webhook routing.' }
    };
    const plan = planInfo[settings.agencyPlan?.toLowerCase()] || { 
        name: settings.agencyPlan || 'Starter Portfolio Plan', 
        desc: 'Multi-property executive dashboard with automated invoice triggers' 
    };

    useEffect(() => {
        getSettings()
            .then(d => {
                const s = d?.data || d;
                if (s) {
                    setSettings(prev => {
                        const merged = {
                            ...prev,
                            ...s,
                            reminderConfig: { ...prev.reminderConfig, ...(s.reminderConfig || {}) },
                            paymentMethods: { ...prev.paymentMethods, ...(s.paymentMethods || {}) },
                            smsTemplates: { ...prev.smsTemplates, ...(s.smsTemplates || {}) },
                            penalties: { ...prev.penalties, ...(s.penalties || {}) },
                            mpesaCredentials: { ...prev.mpesaCredentials, ...(s.mpesaCredentials || {}) }
                        };
                        // Dynamic fallback if agencyName is empty or still default 'KodiPay Agency'
                        if (!merged.agencyName || merged.agencyName === 'KodiPay Agency') {
                            merged.agencyName = 'Mwaura properties';
                        }
                        return merged;
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Keep legacy fallbacks synced with structured payment method parameters
            // Clean up empty tier fields to prevent overwriting existing valid DB credentials
            const updated = getCleanedSettingsForUpdate();
            await updateSettings(updated);
            if (refreshUser) {
                await refreshUser();
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const setVal = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
    const setNested = (group, key, val) => setSettings(prev => ({
        ...prev,
        [group]: { ...prev[group], [key]: val }
    }));

    if (loading) return <LoadingPage />;

    // Block subagents from accessing this page
    if (user && user.role !== 'admin') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <Lock size={24} className="text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Access Restricted</h2>
                <p className="text-xs text-[#64748B] max-w-xs">Only agency administrators can access Settings. Please contact your admin.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Agency Identity', icon: Building2, desc: 'Branding & Localization' },
        { id: 'payments', label: 'Payment Configurations', icon: CreditCard, desc: 'M-Pesa, Bank & Cash setups' },
        { id: 'reminders', label: 'Automated Reminders', icon: Bell, desc: 'Alert schedules & custom templates' },
        { id: 'penalties', label: 'Late Rent Penalties', icon: AlertTriangle, desc: 'Grace periods & fee metrics' },
        { id: 'billing', label: 'Billing & Plan Quota', icon: Sliders, desc: 'SMS logs & active tier metrics' }
    ];

    return (
        <div className="pb-12 space-y-6 max-w-6xl mx-auto px-4 md:px-0 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F1F5F9] pb-6 shrink-0 mt-2">
                <div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-bold uppercase tracking-widest mb-2">
                        <Sliders size={12} className="text-[#94A3B8]" />
                        <span>Settings Control Center</span>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">Agency Settings</h2>
                    <p className="text-xs text-[#64748B] mt-1">Configure your real-estate management portfolio, payment gateways, and tenant reminders</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`h-9 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                        saved
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                >
                    {saving ? <Save size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
                    <span>{saving ? 'Saving...' : saved ? 'Changes Saved!' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Horizontal Tabs Layout */}
            <div className="flex flex-col gap-6 items-start">
                
                {/* Top Tabs Nav */}
                <div className="w-full flex flex-row gap-2 overflow-x-auto shrink-0 pb-2 scrollbar-none">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shrink-0 min-w-[200px] border ${
                                    active
                                    ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-sm'
                                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shadow-sm'
                                }`}
                            >
                                <Icon size={16} className={active ? 'text-amber-500' : 'text-[#94A3B8]'} />
                                <div className="min-w-0">
                                    <span className="text-xs font-bold block leading-none">{tab.label}</span>
                                    <span className={`text-[9px] block mt-1 leading-none ${active ? 'text-amber-200/70' : 'text-[#94A3B8]'}`}>{tab.desc}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Panel Content */}
                <div className="w-full bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden min-h-[480px] flex flex-col justify-between">
                    <div className="p-6 md:p-8 space-y-6">
                        
                        {/* 🏢 GENERAL TAB PANEL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#F1F5F9] pb-4">
                                    <h3 className="text-sm font-bold text-[#0F172A]">Agency Identity</h3>
                                    <p className="text-[11px] text-[#64748B]">Personalize your property management branding details</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FieldGroup label="Agency Registered Name" required>
                                        <div className="relative">
                                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input 
                                                className={InputCls} 
                                                placeholder="e.g. KodiPay Property Agents" 
                                                value={settings.agencyName} 
                                                onChange={e => setVal('agencyName', e.target.value)} 
                                            />
                                        </div>
                                    </FieldGroup>
                                    <FieldGroup label="Agency Support Hotline" required>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input 
                                                type="tel" 
                                                className={InputCls} 
                                                placeholder="e.g. +254 700 123 456" 
                                                value={settings.customerServiceNumber} 
                                                onChange={e => setVal('customerServiceNumber', e.target.value)} 
                                            />
                                        </div>
                                    </FieldGroup>
                                    <FieldGroup label="Default System Currency">
                                        <div className="relative">
                                            <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <select 
                                                className={SelectCls} 
                                                value={settings.defaultCurrency} 
                                                onChange={e => setVal('defaultCurrency', e.target.value)}
                                            >
                                                <option value="KES">KES - Kenyan Shilling (KSh)</option>
                                                <option value="USD">USD - United States Dollar ($)</option>
                                                <option value="UGX">UGX - Ugandan Shilling (USh)</option>
                                                <option value="TZS">TZS - Tanzanian Shilling (TSh)</option>
                                            </select>
                                        </div>
                                    </FieldGroup>
                                    <FieldGroup label="Default Timezone Localization">
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <select 
                                                className={SelectCls} 
                                                value={settings.timezone} 
                                                onChange={e => setVal('timezone', e.target.value)}
                                            >
                                                <option value="Africa/Nairobi">Africa/Nairobi (EAT - UTC+3)</option>
                                                <option value="Africa/Kampala">Africa/Kampala (UTC+3)</option>
                                                <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (UTC+3)</option>
                                                <option value="UTC">UTC Greenwich Mean Time</option>
                                            </select>
                                        </div>
                                    </FieldGroup>
                                    <FieldGroup label="Default Rent Due Day of Month" required hint="Default calendar day when rent is due each month for all tenants.">
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <select 
                                                className={SelectCls} 
                                                value={settings.rentDueDay || 5} 
                                                onChange={e => setVal('rentDueDay', parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month</option>
                                                ))}
                                            </select>
                                        </div>
                                    </FieldGroup>
                                </div>
                                
                                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                                    <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-[#0F172A]">Default Agency Commission Fee</h4>
                                        <p className="text-[11px] text-[#64748B] mt-0.5">When creating new landlord profiles, this default commission rate will automatically apply.</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input 
                                                type="number" 
                                                className="w-16 h-8 px-2 bg-white border border-[#E2E8F0] rounded-md font-bold text-[#0F172A] text-xs focus:outline-none" 
                                                value={settings.defaultCommissionRate}
                                                onChange={e => setVal('defaultCommissionRate', e.target.value)}
                                            />
                                            <span className="text-xs font-bold text-[#0f172a]">% of monthly gross collected rent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 💳 PAYMENTS TAB PANEL */}
                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#F1F5F9] pb-4">
                                    <h3 className="text-sm font-bold text-[#0F172A]">Payment Methods & Integration Gateways</h3>
                                    <p className="text-[11px] text-[#64748B]">Activate and configure dynamic gateways for tenant rent remittance</p>
                                </div>

                                <div className="space-y-4">
                                    <FieldGroup label="Integration Service Tier" required>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <select 
                                                className={SelectCls} 
                                                value={settings.integrationTier} 
                                                onChange={e => setVal('integrationTier', e.target.value)}
                                            >
                                                <option value="manual">Tier 1: Manual Collection & Processing (Default)</option>
                                                <option value="dedicated_mpesa">Tier 2: Dedicated Daraja M-Pesa API Integration</option>
                                            </select>
                                        </div>
                                    </FieldGroup>
                                </div>

                                {/* Tier 1: Manual Collection */}
                                {settings.integrationTier === 'manual' && (
                                    <div className="p-5 border border-[#E2E8F0] rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#64748B] flex items-center justify-center shrink-0">
                                                <CreditCard size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[#0F172A]">Manual M-Pesa / Bank Configuration</h4>
                                                <p className="text-[10px] text-[#64748B]">Tenants pay to your details. You forward the SMS/Receipt for reconciliation.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FieldGroup label="Collection Method">
                                                <select className={SelectCls} value={settings.paymentMethods.mpesaType} onChange={e => setNested('paymentMethods', 'mpesaType', e.target.value)}>
                                                    <option value="paybill">M-Pesa Paybill</option>
                                                    <option value="till">M-Pesa Till Number</option>
                                                </select>
                                            </FieldGroup>
                                            <FieldGroup label="Paybill / Till Number" required>
                                                <input className={InputCls} placeholder="e.g. 522533" value={settings.paymentMethods.mpesaNumber} onChange={e => setNested('paymentMethods', 'mpesaNumber', e.target.value)} />
                                            </FieldGroup>
                                        </div>
                                        {/* Visual Flow Explanation for Tier 1 */}
                                        <div className="mt-6 pt-6 border-t border-[#E2E8F0] space-y-5">
                                            <div className="text-center space-y-1">
                                                <h5 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-widest">How Tier 1 Integration Works</h5>
                                                <p className="text-[10px] text-[#64748B]">Understand the automated manual SMS forwarding pipeline.</p>
                                            </div>
                                            
                                            <div className="relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 overflow-hidden">
                                                {/* Decorative background elements */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                                                
                                                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                                                    
                                                    {/* Step 1: Tenant */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/3">
                                                        <div className="w-12 h-12 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm relative z-10">
                                                            <Smartphone className="text-blue-600" size={20} />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-white">1</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[11px] font-bold text-[#0F172A]">Tenant Payment</h6>
                                                            <p className="text-[10px] text-[#64748B] leading-relaxed">
                                                                Tenant sends rent via M-Pesa to your <span className="font-semibold text-blue-600">Paybill {settings.paymentMethods.mpesaNumber || '4005473'}</span> using their <span className="font-semibold text-blue-600">Phone Number</span> as the Account Number.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Arrow 1 */}
                                                    <div className="hidden md:flex text-[#CBD5E1]">
                                                        <ArrowRight size={24} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="md:flex md:hidden text-[#CBD5E1]">
                                                        <ArrowDown size={24} strokeWidth={1.5} />
                                                    </div>

                                                    {/* Step 2: Agency Phone (Forwarding App) */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/3">
                                                        <div className="w-12 h-12 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm relative z-10">
                                                            <MessageSquare className="text-amber-500" size={20} />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-white">2</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[11px] font-bold text-[#0F172A]">KodiPay App Agent</h6>
                                                            <p className="text-[10px] text-[#64748B] leading-relaxed">
                                                                Your agency phone receives the M-Pesa confirmation SMS. The KodiPay android app automatically <span className="font-semibold text-amber-600">intercepts and forwards</span> the raw SMS.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Arrow 2 */}
                                                    <div className="hidden md:flex text-[#CBD5E1]">
                                                        <ArrowRight size={24} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="md:flex md:hidden text-[#CBD5E1]">
                                                        <ArrowDown size={24} strokeWidth={1.5} />
                                                    </div>

                                                    {/* Step 3: Server Reconciliation */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/3">
                                                        <div className="w-12 h-12 bg-[#0F172A] border border-[#334155] rounded-full flex items-center justify-center shadow-md relative z-10">
                                                            <Server className="text-white" size={20} />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-white">3</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[11px] font-bold text-[#0F172A]">Cloud Reconciliation</h6>
                                                            <p className="text-[10px] text-[#64748B] leading-relaxed">
                                                                KodiPay Server parses the SMS, matches the sender's phone number to a tenant profile, and <span className="font-semibold text-[#0F172A]">clears their rent balance</span> instantly.
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-3">
                                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                                <p className="leading-relaxed font-medium">
                                                    <span className="font-bold text-blue-900 block mb-1">Financial Disbursement Notice</span>
                                                    With Tier 1, all collected funds sit securely in your designated Paybill or Bank Account. You are entirely responsible for manually calculating and disbursing payouts to your property landlords via your own Bank or M-Pesa B2C portals. To automate landlord payouts, consider upgrading to Tier 2 or Tier 3.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tier 2: Dedicated M-Pesa */}
                                {settings.integrationTier === 'dedicated_mpesa' && (
                                    <div className="p-5 border border-emerald-200 bg-emerald-50/30 rounded-xl space-y-5 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-100">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[#0F172A]">Dedicated Daraja M-Pesa API</h4>
                                                <p className="text-[10px] text-[#64748B]">Fully automated STK, C2B Reconciliation, and optional B2B/B2C automated payouts.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-5">
                                                <h5 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-2">M-Pesa C2B API Credentials (Collections)</h5>
                                                <p className="text-[10px] text-[#64748B] leading-relaxed mb-4">
                                                    <strong>How to obtain:</strong> Log in to the <a href="https://developer.safaricom.co.ke" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Safaricom Daraja Portal</a>, go to &quot;My Apps&quot; and create a new application selecting the &quot;Lipa na M-Pesa Sandbox/Production&quot; product. Copy the Consumer Key and Secret generated. For the Passkey, use your Daraja portal to request it.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FieldGroup label="Paybill Shortcode" required>
                                                        <div className="relative w-full">
                                                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                            <input className={InputCls} placeholder="e.g. 522533" value={settings.mpesaCredentials.shortCode} onChange={e => setNested('mpesaCredentials', 'shortCode', e.target.value)} />
                                                        </div>
                                                    </FieldGroup>
                                                    <FieldGroup label="Lipa Na M-Pesa Passkey" required>
                                                        <MaskedInput value={settings.mpesaCredentials.passkey} onChange={e => setNested('mpesaCredentials', 'passkey', e.target.value)} />
                                                    </FieldGroup>
                                                    <FieldGroup label="Daraja Consumer Key" required>
                                                        <MaskedInput value={settings.mpesaCredentials.consumerKey} onChange={e => setNested('mpesaCredentials', 'consumerKey', e.target.value)} />
                                                    </FieldGroup>
                                                    <FieldGroup label="Daraja Consumer Secret" required>
                                                        <MaskedInput value={settings.mpesaCredentials.consumerSecret} onChange={e => setNested('mpesaCredentials', 'consumerSecret', e.target.value)} />
                                                    </FieldGroup>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-emerald-100">
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-5">
                                                <h5 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-2">M-Pesa B2B/B2C API Credentials (Payouts)</h5>
                                                <p className="text-[10px] text-[#64748B] leading-relaxed mb-4">
                                                    <strong>How to obtain:</strong> These are required ONLY if you intend to automate disbursals to landlords (Auto-Split). You must create an &quot;API Operator&quot; user in your M-Pesa Organization Portal. The <em>Initiator Name</em> is the username of this operator. The <em>Security Credential</em> is the encrypted API password generated using the Safaricom Public Security Certificate.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FieldGroup label="Initiator Name" hint="Required for automated disbursals to landlords">
                                                        <div className="relative w-full">
                                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                            <input className={InputCls} placeholder="e.g. api_operator" value={settings.mpesaCredentials.initiatorName} onChange={e => setNested('mpesaCredentials', 'initiatorName', e.target.value)} />
                                                        </div>
                                                    </FieldGroup>
                                                    <FieldGroup label="Security Credential" hint="Generated via Safaricom portal">
                                                        <MaskedInput value={settings.mpesaCredentials.securityCredential} onChange={e => setNested('mpesaCredentials', 'securityCredential', e.target.value)} />
                                                    </FieldGroup>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-emerald-100">
                                            <div className="mb-2">
                                                <h5 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">Automated Payout Routing Protocol</h5>
                                                <p className="text-[10px] text-[#64748B] mt-1">Configure how disbursal to clients (property owners) will occur once tenant rent hits your Dedicated Paybill.</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className={`p-4 border rounded-xl cursor-pointer transition-all ${settings.payoutRouting === 'manual' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20' : 'border-[#E2E8F0] bg-white hover:border-emerald-300'}`} onClick={() => setVal('payoutRouting', 'manual')}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.payoutRouting === 'manual' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                                            {settings.payoutRouting === 'manual' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-[#0F172A]">Manual Payout Trigger</span>
                                                    </div>
                                                    <p className="text-[10px] text-[#64748B] leading-relaxed pl-7">
                                                        Funds pool in your M-Pesa account. You will manually trigger bulk disbursals to landlords from the KodiPay dashboard at a later date.
                                                    </p>
                                                </div>

                                                <div className={`p-4 border rounded-xl cursor-pointer transition-all ${settings.payoutRouting === 'auto_split' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20' : 'border-[#E2E8F0] bg-white hover:border-emerald-300'}`} onClick={() => setVal('payoutRouting', 'auto_split')}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.payoutRouting === 'auto_split' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                                            {settings.payoutRouting === 'auto_split' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-[#0F172A]">Immediate Auto-Split</span>
                                                    </div>
                                                    <p className="text-[10px] text-[#64748B] leading-relaxed pl-7">
                                                        Disbursal occurs <span className="font-semibold text-emerald-600">immediately</span> after hitting the account. The system automatically triggers a B2C/B2B payout of the net balance to the landlord.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Flow Explanation for Tier 2 */}
                                        <div className="mt-6 pt-6 border-t border-emerald-100/50 space-y-5">
                                            <div className="text-center space-y-1">
                                                <h5 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-widest">How Tier 2 Integration Works</h5>
                                                <p className="text-[10px] text-[#64748B]">Direct Daraja API Gateway Pipeline.</p>
                                            </div>
                                            
                                            <div className="relative bg-white border border-emerald-100 rounded-xl p-6 overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                
                                                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                                                    {/* Step 1: Tenant */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
                                                        <div className="w-10 h-10 bg-slate-50 border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm relative z-10">
                                                            <Smartphone className="text-blue-600" size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[10px] font-bold text-[#0F172A]">1. Payment</h6>
                                                            <p className="text-[9px] text-[#64748B] leading-relaxed">
                                                                Tenant pays to Dedicated Paybill via STK Push or C2B.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:flex text-emerald-200"><ArrowRight size={20} strokeWidth={1.5} /></div>
                                                    <div className="md:hidden text-emerald-200"><ArrowDown size={20} strokeWidth={1.5} /></div>

                                                    {/* Step 2: Daraja */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
                                                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center shadow-sm relative z-10">
                                                            <Globe className="text-emerald-600" size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[10px] font-bold text-[#0F172A]">2. Safaricom Gateway</h6>
                                                            <p className="text-[9px] text-[#64748B] leading-relaxed">
                                                                Daraja receives funds and fires a realtime webhook.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:flex text-emerald-200"><ArrowRight size={20} strokeWidth={1.5} /></div>
                                                    <div className="md:hidden text-emerald-200"><ArrowDown size={20} strokeWidth={1.5} /></div>

                                                    {/* Step 3: Server Reconciliation */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
                                                        <div className="w-10 h-10 bg-[#0F172A] border border-[#334155] rounded-full flex items-center justify-center shadow-md relative z-10">
                                                            <Server className="text-white" size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[10px] font-bold text-[#0F172A]">3. Auto-Reconcile</h6>
                                                            <p className="text-[9px] text-[#64748B] leading-relaxed">
                                                                Server processes payload, clears tenant balance instantly.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:flex text-emerald-200"><ArrowRight size={20} strokeWidth={1.5} /></div>
                                                    <div className="md:hidden text-emerald-200"><ArrowDown size={20} strokeWidth={1.5} /></div>

                                                    {/* Step 4: Payout */}
                                                    <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
                                                        <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center shadow-sm relative z-10">
                                                            <Coins className="text-amber-600" size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h6 className="text-[10px] font-bold text-[#0F172A]">4. Disbursal</h6>
                                                            <p className="text-[9px] text-[#64748B] leading-relaxed">
                                                                Server initiates B2C/B2B payout stub to Landlord account.
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {/* Daraja Webhooks Expanded */}
                                                <div className="p-5 bg-white border border-emerald-200 rounded-xl space-y-4 shadow-sm">
                                                    <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                                                        <Globe size={16} className="text-emerald-600" />
                                                        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Safaricom Daraja Webhook Registration</span>
                                                    </div>
                                                    <div className="text-[10px] text-[#64748B] leading-relaxed pr-2">
                                                        <p className="mb-2">To complete your Tier 2 Dedicated M-Pesa API integration, you must register the following KodiPay listener endpoints inside your Safaricom Daraja Developer Portal. These URLs allow Safaricom to securely ping our servers the exact millisecond a tenant makes a payment.</p>
                                                        <ul className="list-disc pl-4 space-y-1 mb-4">
                                                            <li><strong>Validation URL:</strong> KodiPay will verify if the Account Number exists in your ledger before accepting funds.</li>
                                                            <li><strong>Confirmation URL:</strong> KodiPay will finalize the ledger entry and trigger Auto-Split disbursals if enabled.</li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="space-y-3 font-mono text-[10px] text-emerald-800 bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg select-all overflow-x-auto">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                            <span className="font-bold text-emerald-600 md:w-28 shrink-0">Validation URL:</span> 
                                                            <span className="text-slate-700">{API_BASE_URL.replace(/\/api$/, '')}/api/webhook/gateway/validation</span>
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                            <span className="font-bold text-emerald-600 md:w-28 shrink-0">Confirmation URL:</span> 
                                                            <span className="text-slate-700">{API_BASE_URL.replace(/\/api$/, '')}/api/webhook/gateway/confirmation</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-emerald-100 mt-2">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100/50">
                                                            <CheckSquare size={14} /> Values auto-validate upon transaction simulation.
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleRegisterWebhooks}
                                                            disabled={registering}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                                                        >
                                                            {registering ? <Zap size={14} className="animate-spin" /> : <Globe size={14} />}
                                                            <span>{registering ? 'Registering...' : 'Register Webhooks Automatically'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>
                        )}

                        {/* ⏰ REMINDERS TAB PANEL */}
                        {activeTab === 'reminders' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#F1F5F9] pb-4">
                                    <h3 className="text-sm font-bold text-[#0F172A]">Automated Rent Reminders Schedule</h3>
                                    <p className="text-[11px] text-[#64748B]">Set exact month schedules and custom tenant notification message formats</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FieldGroup label="Scheduled Day of Month" hint="Between 1 and 28 (Nairobi scheduler)">
                                        <div className="relative">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input 
                                                type="number" min="1" max="28"
                                                className={InputCls} 
                                                value={settings.reminderConfig.dayOfMonth} 
                                                onChange={e => setNested('reminderConfig', 'dayOfMonth', parseInt(e.target.value))} 
                                            />
                                        </div>
                                    </FieldGroup>
                                    <FieldGroup label="Scheduled Daily Send Time" hint="EAT Local Time">
                                        <div className="relative">
                                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input 
                                                type="time" 
                                                className={InputCls} 
                                                value={settings.reminderConfig.time} 
                                                onChange={e => setNested('reminderConfig', 'time', e.target.value)} 
                                            />
                                        </div>
                                    </FieldGroup>
                                </div>

                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs font-semibold text-amber-700">
                                    ⏰ Reminders and automated invoice dispatches will automatically execute on day <strong>{settings.reminderConfig.dayOfMonth}</strong> of every calendar month at exactly <strong>{settings.reminderConfig.time}</strong> EAT.
                                </div>

                                {/* Custom SMS Templates */}
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <MessageSquare size={14} className="text-amber-500" />
                                        <span>Custom SMS Notification Templates</span>
                                    </h4>

                                    <div className="space-y-4">
                                        <FieldGroup 
                                            label="1. Rent Invoice Due SMS Template" 
                                            hint="Parameters: {tenantName}, {unitName}, {amount}, {paybill}, {customerServiceNumber}"
                                        >
                                            <textarea 
                                                className={TextareaCls}
                                                value={settings.smsTemplates.rentDue}
                                                onChange={e => setNested('smsTemplates', 'rentDue', e.target.value)}
                                            />
                                        </FieldGroup>

                                        <FieldGroup 
                                            label="2. Overdue Rent Alert SMS Template" 
                                            hint="Sent automatically when the grace period expires without receipt"
                                        >
                                            <textarea 
                                                className={TextareaCls}
                                                value={settings.smsTemplates.rentOverdue}
                                                onChange={e => setNested('smsTemplates', 'rentOverdue', e.target.value)}
                                            />
                                        </FieldGroup>

                                        <FieldGroup 
                                            label="3. Payment Received Confirmation SMS" 
                                            hint="Sent immediately when rent ledger records new collected payment"
                                        >
                                            <textarea 
                                                className={TextareaCls}
                                                value={settings.smsTemplates.paymentConfirmation}
                                                onChange={e => setNested('smsTemplates', 'paymentConfirmation', e.target.value)}
                                            />
                                        </FieldGroup>
                                    </div>
                                </div>

                                {/* Notification Preferences Toggles */}
                                <div className="space-y-4 pt-6 border-t border-[#F1F5F9]">
                                    <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <Bell size={14} className="text-amber-500" />
                                        <span>Communication Preferences</span>
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-white shadow-sm">
                                            <div>
                                                <h5 className="text-[11px] font-bold text-[#0F172A]">Tenant Payment Receipts (SMS)</h5>
                                                <p className="text-[10px] text-[#64748B] mt-0.5">Automatically send SMS receipts to tenants when rent is recorded.</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setNested('reminderConfig', 'sendConfirmationSMS', !settings.reminderConfig.sendConfirmationSMS)}
                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 ${settings.reminderConfig.sendConfirmationSMS ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.reminderConfig.sendConfirmationSMS ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-white shadow-sm">
                                            <div>
                                                <h5 className="text-[11px] font-bold text-[#0F172A]">Landlord Auto-Split Alerts (SMS & Email)</h5>
                                                <p className="text-[10px] text-[#64748B] mt-0.5">Notify property owners instantly when net balances are disbursed to them via Auto-Split.</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setNested('reminderConfig', 'sendLandlordAutoSplit', !settings.reminderConfig.sendLandlordAutoSplit)}
                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 ${settings.reminderConfig.sendLandlordAutoSplit !== false ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.reminderConfig.sendLandlordAutoSplit !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ⚠️ PENALTIES TAB PANEL */}
                        {activeTab === 'penalties' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#F1F5F9] pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-[#0F172A]">Tenant Late Rent Penalties</h3>
                                        <p className="text-[11px] text-[#64748B]">Calculate and invoice late penalties automatically after grace periods expire</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setNested('penalties', 'active', !settings.penalties.active)}
                                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${settings.penalties.active ? 'bg-amber-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.penalties.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {settings.penalties.active ? (
                                    <div className="space-y-5 animate-zoom-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FieldGroup label="Penalty Charging Type">
                                                <div className="relative">
                                                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <select 
                                                        className={SelectCls}
                                                        value={settings.penalties.type}
                                                        onChange={e => setNested('penalties', 'type', e.target.value)}
                                                    >
                                                        <option value="flat">Flat Rate Charge (KES)</option>
                                                        <option value="percent">Percentage rate (%) of Rent</option>
                                                    </select>
                                                </div>
                                            </FieldGroup>

                                            <FieldGroup label="Penalty Value Rate" required>
                                                <div className="relative">
                                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <input 
                                                        type="number"
                                                        className={InputCls} 
                                                        placeholder={settings.penalties.type === 'flat' ? 'e.g. 500' : 'e.g. 5'} 
                                                        value={settings.penalties.value} 
                                                        onChange={e => setNested('penalties', 'value', e.target.value)} 
                                                    />
                                                </div>
                                            </FieldGroup>

                                            <FieldGroup label="Grace Period (Calendar Days)" required>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <input 
                                                        type="number"
                                                        className={InputCls} 
                                                        placeholder="e.g. 5" 
                                                        value={settings.penalties.gracePeriodDays} 
                                                        onChange={e => setNested('penalties', 'gracePeriodDays', e.target.value)} 
                                                    />
                                                </div>
                                            </FieldGroup>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <FieldGroup label="Charging Recurrence Frequency">
                                                <div className="relative">
                                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <select 
                                                        className={SelectCls}
                                                        value={settings.penalties.frequency}
                                                        onChange={e => setNested('penalties', 'frequency', e.target.value)}
                                                    >
                                                        <option value="once">One-time penalty fee</option>
                                                        <option value="daily">Daily compounding late fees</option>
                                                    </select>
                                                </div>
                                            </FieldGroup>

                                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between mt-2.5">
                                                <div>
                                                    <h5 className="text-[11px] font-bold text-[#0F172A]">Auto-invoice Late Penalty</h5>
                                                    <p className="text-[9px] text-[#64748B]">Automatically push a debit fee invoice to the tenant ledger</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setNested('penalties', 'autoInvoice', !settings.penalties.autoInvoice)}
                                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${settings.penalties.autoInvoice ? 'bg-amber-500' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.penalties.autoInvoice ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                                            <div className="text-xs">
                                                <span className="font-bold">Active Late Rent Penalty Protocol:</span>
                                                <p className="mt-1">
                                                    If a tenant is late by more than <strong>{settings.penalties.gracePeriodDays} days</strong>, they will be charged a 
                                                    <strong> {settings.penalties.type === 'flat' ? `KSh ${settings.penalties.value}` : `${settings.penalties.value}%`}</strong> late fee penalty as a 
                                                    <strong> {settings.penalties.frequency === 'once' ? 'one-time' : 'daily recurring'}</strong> charge.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 border border-[#E2E8F0] border-dashed rounded-xl text-center text-xs text-[#94A3B8] space-y-2">
                                        <BadgeAlert className="mx-auto text-slate-300" size={32} />
                                        <p className="font-bold">Late Penalty invoicing protocol is currently disabled</p>
                                        <p className="text-[10px] text-slate-400">Toggle on the switch above to activate grace days and automated penalty fee ledgers.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 📊 BILLING TAB PANEL */}
                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#F1F5F9] pb-4">
                                    <h3 className="text-sm font-bold text-[#0F172A]">Platform Billing & System Plan Quotas</h3>
                                    <p className="text-[11px] text-[#64748B]">Manage system subscriptions, and monitor API transactional SMS logs</p>
                                </div>

                                <div className="p-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">Active License tier</span>
                                        <h4 className="text-lg font-black tracking-tight text-white mt-1 uppercase">{plan.name}</h4>
                                        <p className="text-xs text-[#94A3B8] mt-1">{plan.desc}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-[#ffffff10] border border-[#ffffff15] rounded-full text-[10px] font-bold text-amber-400">
                                        Active Plan • Renews June 1, 2026
                                    </div>
                                </div>

                                {/* SMS usage tracking */}
                                <div className="space-y-4 p-5 border border-[#E2E8F0] rounded-xl">
                                    <div className="flex items-center justify-between text-xs">
                                        <div>
                                            <h5 className="font-bold text-[#0F172A]">Transactional SMS Usage Track</h5>
                                            <p className="text-[10px] text-[#64748B]">Monthly quota allocated for tenant receipts & penalty warnings</p>
                                        </div>
                                        <span className="font-mono font-bold text-[#0F172A]">
                                            {settings.smsQuotaUsed} / {settings.smsQuotaTotal} SMS Sent
                                        </span>
                                    </div>

                                    {/* Quota bar */}
                                    <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                                            style={{ width: `${(settings.smsQuotaUsed / settings.smsQuotaTotal) * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                                        <span>Quota resets in 12 days</span>
                                        <span className="font-bold text-[#007AFF] hover:underline cursor-pointer">Buy SMS Add-on Pack</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                                        <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider block">SMS Server Dispatch</span>
                                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                            Operational (100% UP)
                                        </span>
                                    </div>
                                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                                        <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider block">Default Payment Timezone</span>
                                        <span className="text-sm font-bold text-[#0F172A] mt-1 block">Africa/Nairobi (EAT)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Form Footer Status & Save trigger */}
                    <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                            <Info size={12} className="text-[#94A3B8]" />
                            <span>Values auto-validate on submit</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`h-9 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                                saved
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#0F172A] hover:bg-black text-white'
                            }`}
                        >
                            {saving ? <Save size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
                            <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}</span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
