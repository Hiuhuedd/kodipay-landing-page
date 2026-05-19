'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { PageHeader, LoadingPage } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { 
    CreditCard, Building2, Bell, Info, Save, Check, Hash, Phone, Calendar, 
    Clock, Sliders, Globe, AlertTriangle, Sparkles, MessageSquare, AlertCircle, 
    Lock, Mail, Landmark, CheckSquare, Zap, BadgeAlert, Coins
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

export default function SettingsPage() {
    const { user } = useAuth();
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
            sendConfirmationSMS: true
        },
        
        smsTemplates: {
            rentDue: 'Dear {tenantName}, rent for {propertyName} unit {unitName} is due. Please pay KSh {amount} via Paybill {paybill}. Support: {customerServiceNumber}',
            rentOverdue: 'Dear {tenantName}, rent of KSh {amount} for {propertyName} unit {unitName} is overdue. Please pay immediately to avoid late penalties. Support: {customerServiceNumber}',
            paymentConfirmation: 'Hello {tenantName}, we have received KSh {amount} for {propertyName} unit {unitName}. Thank you!'
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
        agencyPlan: 'Enterprise Professional'
    });

    const [activeTab, setActiveTab] = useState('general'); // 'general', 'payments', 'reminders', 'penalties', 'billing'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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
                            penalties: { ...prev.penalties, ...(s.penalties || {}) }
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
            const updated = {
                ...settings,
                paymentMethod: settings.paymentMethods.mpesaActive ? 'mpesa' : 'cash',
                paybill: settings.paymentMethods.mpesaNumber || '522533'
            };
            await updateSettings(updated);
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

            {/* Two-Column Panel Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Side: Tabs Nav Sidebar */}
                <div className="w-full lg:w-[260px] flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 border-b lg:border-b-0 lg:border-r border-[#E2E8F0] pb-4 lg:pb-0 lg:pr-6 scrollbar-none">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all shrink-0 w-auto lg:w-full ${
                                    active
                                    ? 'bg-[#0F172A] text-white shadow-sm'
                                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                                }`}
                            >
                                <Icon size={16} className={active ? 'text-amber-500' : 'text-[#94A3B8]'} />
                                <div className="min-w-0">
                                    <span className="text-xs font-bold block leading-none">{tab.label}</span>
                                    <span className={`text-[9px] block mt-0.5 leading-none ${active ? 'text-amber-200/70' : 'text-[#94A3B8]'}`}>{tab.desc}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Side: Tab Panel Content */}
                <div className="flex-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden min-h-[480px] flex flex-col justify-between">
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

                                {/* M-Pesa Integration Block */}
                                <div className="p-5 border border-[#E2E8F0] rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0">M</div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[#0F172A]">Safaricom M-Pesa API Integration</h4>
                                                <p className="text-[10px] text-[#64748B]">Automated STK push invoicing & transaction ledger checks</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setNested('paymentMethods', 'mpesaActive', !settings.paymentMethods.mpesaActive)}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${settings.paymentMethods.mpesaActive ? 'bg-emerald-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.paymentMethods.mpesaActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {settings.paymentMethods.mpesaActive && (
                                        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#F1F5F9]">
                                            <FieldGroup label="Integration Channel Type">
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <select 
                                                        className={SelectCls} 
                                                        value={settings.paymentMethods.mpesaType} 
                                                        onChange={e => setNested('paymentMethods', 'mpesaType', e.target.value)}
                                                    >
                                                        <option value="paybill">Lipa Na M-Pesa Paybill</option>
                                                        <option value="till">Lipa Na M-Pesa Buy Goods Till</option>
                                                    </select>
                                                </div>
                                            </FieldGroup>
                                            <FieldGroup label="Paybill / Till Shortcode" required>
                                                <div className="relative">
                                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <input 
                                                        className={InputCls} 
                                                        placeholder="e.g. 522533" 
                                                        value={settings.paymentMethods.mpesaNumber} 
                                                        onChange={e => setNested('paymentMethods', 'mpesaNumber', e.target.value)} 
                                                    />
                                                </div>
                                            </FieldGroup>
                                        </div>
                                    )}
                                </div>

                                {/* Bank Account Configuration Block */}
                                <div className="p-5 border border-[#E2E8F0] rounded-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Landmark size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[#0F172A]">Direct Bank Transfer / Paybill Routing</h4>
                                                <p className="text-[10px] text-[#64748B]">Authorize rent collection direct into bank accounts</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setNested('paymentMethods', 'bankActive', !settings.paymentMethods.bankActive)}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${settings.paymentMethods.bankActive ? 'bg-emerald-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.paymentMethods.bankActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {settings.paymentMethods.bankActive && (
                                        <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#F1F5F9]">
                                            <FieldGroup label="Select Bank Institution">
                                                <div className="relative">
                                                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <select 
                                                        className={SelectCls} 
                                                        value={settings.paymentMethods.bankName} 
                                                        onChange={e => setNested('paymentMethods', 'bankName', e.target.value)}
                                                    >
                                                        <option value="Equity Bank">Equity Bank</option>
                                                        <option value="KCB Bank">KCB Bank</option>
                                                        <option value="Cooperative Bank">Cooperative Bank</option>
                                                        <option value="NCBA Bank">NCBA Bank</option>
                                                        <option value="Absa Bank">Absa Bank</option>
                                                        <option value="Stanbic Bank">Stanbic Bank</option>
                                                    </select>
                                                </div>
                                            </FieldGroup>
                                            <FieldGroup label="Bank Account Title" required>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <input 
                                                        className={InputCls} 
                                                        placeholder="e.g. KodiPay Holding Ltd" 
                                                        value={settings.paymentMethods.bankBranch} 
                                                        onChange={e => setNested('paymentMethods', 'bankBranch', e.target.value)} 
                                                    />
                                                </div>
                                            </FieldGroup>
                                            <FieldGroup label="Bank Account Number" required>
                                                <div className="relative">
                                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                    <input 
                                                        className={InputCls} 
                                                        placeholder="e.g. 1220194834" 
                                                        value={settings.paymentMethods.bankAccountNumber} 
                                                        onChange={e => setNested('paymentMethods', 'bankAccountNumber', e.target.value)} 
                                                    />
                                                </div>
                                            </FieldGroup>
                                        </div>
                                    )}
                                </div>
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
                                            hint="Parameters: {tenantName}, {propertyName}, {unitName}, {amount}, {paybill}, {customerServiceNumber}"
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
