'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { PageHeader, LoadingPage } from '@/components/ui';
import { CreditCard, Building2, Bell, Info, Save, Check, Hash, Phone, Calendar, Clock } from 'lucide-react';

const FieldGroup = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        {children}
        {hint && <p className="text-[10px] font-bold text-slate-400">{hint}</p>}
    </div>
);

const InputCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 outline-none transition-all text-sm placeholder:font-normal placeholder:text-slate-400";
const SelectCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 outline-none transition-all text-sm";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        paybill: '',
        paymentMethod: 'mpesa',
        customerServiceNumber: '',
        reminderConfig: { dayOfMonth: 15, time: '14:00' },
        agencyName: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getSettings()
            .then(d => { const s = d?.data || d; if (s) setSettings(prev => ({ ...prev, ...s })); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); alert('Failed to save settings.'); }
        finally { setSaving(false); }
    };

    const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
    const setReminder = (key, val) => setSettings(prev => ({ ...prev, reminderConfig: { ...prev.reminderConfig, [key]: val } }));

    if (loading) return <LoadingPage />;

    return (
        <div className="pb-12 animate-in fade-in duration-500">
            <PageHeader title="Settings" subtitle="Configure your KodiPay application">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${saved
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-[#007AFF] text-white hover:bg-[#014AAD]'
                    }`}
                >
                    {saving ? <><Save size={14} className="animate-pulse" /> Saving...</> :
                     saved ? <><Check size={14} /> Saved!</> :
                     <><Save size={14} /> Save Changes</>}
                </button>
            </PageHeader>

            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Payment Configuration */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                            <CreditCard size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Configuration</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <FieldGroup label="Payment Method">
                                <div className="relative">
                                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <select className={SelectCls} value={settings.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="cash">Cash Only</option>
                                    </select>
                                </div>
                            </FieldGroup>
                            {settings.paymentMethod === 'mpesa' && (
                                <FieldGroup label="M-Pesa Paybill Number" hint="Tenants will use this to pay rent">
                                    <div className="relative">
                                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input className={InputCls} placeholder="e.g. 522533" value={settings.paybill || ''} onChange={e => set('paybill', e.target.value)} />
                                    </div>
                                </FieldGroup>
                            )}
                        </div>
                    </div>

                    {/* Agency Information */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency Information</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <FieldGroup label="Agency Name">
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input className={InputCls} placeholder="e.g. KodiPay Property Management" value={settings.agencyName || ''} onChange={e => set('agencyName', e.target.value)} />
                                </div>
                            </FieldGroup>
                            <FieldGroup label="Customer Service Number">
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input type="tel" className={InputCls} placeholder="e.g. 0700123456" value={settings.customerServiceNumber || ''} onChange={e => set('customerServiceNumber', e.target.value)} />
                                </div>
                            </FieldGroup>
                        </div>
                    </div>

                    {/* Reminder Configuration */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                            <Bell size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminder Schedule</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <FieldGroup label="Day of Month" hint="Between 1–28">
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input
                                            type="number" min="1" max="28"
                                            className={InputCls + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"}
                                            value={settings.reminderConfig?.dayOfMonth || 15}
                                            onChange={e => setReminder('dayOfMonth', parseInt(e.target.value))}
                                        />
                                    </div>
                                </FieldGroup>
                                <FieldGroup label="Send Time">
                                    <div className="relative">
                                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input type="time" className={InputCls} value={settings.reminderConfig?.time || '14:00'} onChange={e => setReminder('time', e.target.value)} />
                                    </div>
                                </FieldGroup>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold text-amber-700">
                                ⏰ Reminders auto-send on day <strong>{settings.reminderConfig?.dayOfMonth}</strong> at <strong>{settings.reminderConfig?.time}</strong> (Nairobi time)
                            </div>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                            <Info size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Information</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { label: 'Platform', value: 'KodiPay Web v2.0' },
                                { label: 'Backend', value: 'RentManager API' },
                                { label: 'Database', value: 'Firebase Firestore' },
                                { label: 'Currency', value: 'KES (Kenyan Shilling)' },
                                { label: 'Timezone', value: 'Africa/Nairobi (EAT)' },
                            ].map(r => (
                                <div key={r.label} className="flex justify-between items-center px-6 py-3.5">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{r.label}</span>
                                    <span className="text-xs font-black text-slate-900">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
