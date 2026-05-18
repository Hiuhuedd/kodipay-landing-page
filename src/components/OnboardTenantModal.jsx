'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, FileCheck, Loader2, CheckCircle2, Building2, Home, FileText, Send, Printer } from 'lucide-react';
import { getProperties, getPropertyById, createTenant, sendReminders } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

// ── Agreement Preview Modal ──────────────────────────────────────────────────
function AgreementModal({ unit, propertyName, address, agencyName, onClose }) {
  const tenant = unit.tenant;
  const today = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' });
  const moveIn = tenant.moveInDate
    ? new Date(tenant.moveInDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '_______________';

  const contractId = `KP-${String(unit.unitId).replace(/\s+/g, '').toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    const printContent = document.getElementById('agreement-print-area').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Tenancy Agreement — ${tenant.name} — ${unit.unitId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: #0F172A; padding: 40px; }
            h1 { font-size: 20px; text-align: center; margin-bottom: 4px; font-weight: 700; }
            h2 { font-size: 14px; text-align: center; color: #64748B; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
            h3 { font-size: 11px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.15em; color: #64748B; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            td { padding: 4px 8px; vertical-align: top; }
            td:first-child { font-weight: 700; width: 40%; color: #64748B; }
            .sig-block { margin-top: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sig-line { border-top: 1px solid #0F172A; margin-top: 48px; padding-top: 8px; font-size: 11px; font-weight: 600; }
            .footer { text-align: center; margin-top: 60px; font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.2em; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-md shadow-2xl overflow-hidden border border-[#E2E8F0] text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-[0.15em]">Tenancy Agreement</h2>
            <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mt-1">{contractId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-9 px-4 bg-[#0F172A] text-white rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} /> Print Document
            </button>
            <button onClick={onClose} className="p-2 rounded-md text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Agreement Body */}
        <div className="overflow-y-auto flex-1 p-10 bg-white" id="agreement-print-area">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Agency-Managed Tenancy Agreement</h1>
            <p className="text-xs text-[#64748B] mt-2 uppercase tracking-[0.15em]">Established under the Laws of the Republic of Kenya</p>
            <div className="flex justify-center gap-16 mt-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-1.5">Contract ID</p>
                <p className="text-sm font-semibold text-[#0F172A] tabular-nums">{contractId}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-1.5">Execution Date</p>
                <p className="text-sm font-semibold text-[#0F172A]">{today}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#E2E8F0] mb-10"></div>

          {/* 1. PARTIES */}
          <section className="mb-10">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-6 border-b border-[#E2E8F0] pb-2">1. Parties to the Agreement</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-[#F8FAFC] rounded-md p-5 border border-[#E2E8F0]">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Managing Agency</p>
                <p className="text-[13px] font-bold text-[#0F172A]">{agencyName || 'KodiPay Agency'}</p>
                <p className="text-[12px] text-[#64748B] mt-1">Authorized KodiPay Agent</p>
                <p className="text-[11px] text-[#94A3B8] mt-3 uppercase tracking-wider">Representative for</p>
                <p className="text-[12px] font-bold text-[#0F172A] mt-0.5">{propertyName || '_______________'}</p>
              </div>
              <div className="bg-[#F8FAFC] rounded-md p-5 border border-[#E2E8F0]">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Tenant</p>
                <p className="text-[13px] font-bold text-[#0F172A]">{tenant.name}</p>
                <p className="text-[12px] text-[#64748B] mt-1 tabular-nums">{tenant.phone}</p>
                <p className="text-[11px] text-[#94A3B8] mt-3 uppercase tracking-wider">ID / Passport Number</p>
                <p className="text-[12px] font-bold text-[#0F172A] mt-0.5">{tenant.idNumber || '_______________'}</p>
              </div>
            </div>
          </section>

          {/* 2. PROPERTY */}
          <section className="mb-10">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-4 border-b border-[#E2E8F0] pb-2">2. Property Details</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-[13px]">
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Property</span>
                <span className="font-semibold text-[#0F172A]">{propertyName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Location</span>
                <span className="font-semibold text-[#0F172A]">{address || 'Nairobi, Kenya'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Unit</span>
                <span className="font-semibold text-[#0F172A]">{unit.unitId} ({unit.category || 'Residential'})</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Move-in Date</span>
                <span className="font-semibold text-[#0F172A]">{moveIn}</span>
              </div>
            </div>
          </section>

          {/* 3. FINANCIAL TERMS */}
          <section className="mb-10">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-4 border-b border-[#E2E8F0] pb-2">3. Financial Terms</h3>
            <div className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden">
              {[
                ['Monthly Rent', `KES ${Number(unit.rentAmount).toLocaleString()}`],
                ['Security Deposit', `KES ${Number(unit.depositAmount).toLocaleString()}`],
                ['Garbage Fee', `KES ${Number(unit.utilityFees?.garbageFee || 0).toLocaleString()} / month`],
                ['Water Bill', 'As per monthly meter reading'],
                ['Rent Due Date', '1st of every month (Late after 5th)'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-5 py-4 border-b border-[#F1F5F9] last:border-0">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{label}</span>
                  <span className="text-[13px] font-bold text-[#0F172A] tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. TERMS */}
          <section className="mb-10 space-y-6 text-[12px] leading-relaxed">
            <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.2em] mb-4 border-b border-[#E2E8F0] pb-2">4. General Terms</h3>
            {[
              ['Tenancy Type', 'Month-to-Month, renewable by mutual consent.'],
              ['Notice Period', 'Either party shall give a minimum of one (1) calendar month\'s written notice before vacating or terminating this agreement.'],
              ['Tenant Obligations', 'The tenant shall pay rent on or before the 1st of each month, maintain the unit in good condition, and abide by house rules.'],
              ['Agency Obligations', `${agencyName || 'The Managing Agency'} shall ensure the unit is habitable and provide digital receipts for all payments.`],
            ].map(([title, body]) => (
              <div key={title} className="space-y-1">
                <p className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider">{title}</p>
                <p className="text-[#64748B]">{body}</p>
              </div>
            ))}
          </section>

          {/* Signatures */}
          <section className="mt-16 pt-8 border-t border-[#0F172A]/10">
            <div className="grid grid-cols-2 gap-16">
              <div>
                <div className="h-px bg-[#0F172A] mb-3"></div>
                <p className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">Authorized Managing Agent</p>
                <p className="text-[10px] text-[#64748B] mt-1">{agencyName || 'KodiPay Agency'}</p>
              </div>
              <div>
                <div className="h-px bg-[#0F172A] mb-3"></div>
                <p className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">Tenant</p>
                <p className="text-[10px] text-[#64748B] mt-1">{tenant.name}</p>
              </div>
            </div>
          </section>

          <p className="text-center text-[9px] text-[#94A3B8] mt-16 font-bold uppercase tracking-[0.3em]">
            KodiPay Digital Contract · Generated {today}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main OnboardTenantModal ──────────────────────────────────────────────────
export default function OnboardTenantModal({ propertyId, unitId, onClose, onSuccess }) {
    const { user } = useAuth();
    const agencyName = user?.agencyName || '';

    const [properties, setProperties] = useState([]);
    const [property, setProperty] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
    const [selectedUnitId, setSelectedUnitId] = useState(unitId || '');
    const [previewUnit, setPreviewUnit] = useState(null);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        idNumber: '',
        moveInDate: new Date().toISOString().split('T')[0],
        depositAmount: '',
        paperwork: { copyId: false, signedAgreement: false, passportPhoto: false },
        sendWelcomeSMS: false,
        isExistingTenant: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch properties list on mount
    useEffect(() => {
        getProperties()
            .then(d => {
                const list = d?.data || d || [];
                setProperties(list);
            })
            .catch(console.error);
    }, []);

    // Fetch full property details when selectedPropertyId changes
    useEffect(() => {
        if (!selectedPropertyId) {
            setProperty(null);
            return;
        }

        getPropertyById(selectedPropertyId)
            .then(res => {
                const fullProp = res?.data || res;
                setProperty(fullProp);
                if (!unitId && fullProp) {
                    const vacant = (fullProp.units || []).find(u => !u.tenantId);
                    if (vacant) setSelectedUnitId(vacant.unitId || vacant.unitCode);
                }
            })
            .catch(err => {
                console.error('Failed to fetch property details:', err);
            });
    }, [selectedPropertyId, unitId]);

    const handlePropertyChange = (e) => {
        const id = e.target.value;
        setSelectedPropertyId(id);
        setSelectedUnitId('');
    };

    const vacantUnits = (property?.units || []).filter(u => !u.tenantId || (unitId && (u.unitId || u.unitCode) === unitId));
    const selectedUnit = (property?.units || []).find(u =>
        (u.unitId || u.unitCode) === selectedUnitId
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) {
            setError('Tenant name and phone number are required.');
            return;
        }
        if (!selectedPropertyId) {
            setError('Please select a property.');
            return;
        }
        if (!selectedUnitId) {
            setError('Please select a unit.');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            const created = await createTenant({
                name: form.name.trim(),
                phone: form.phone.trim(),
                idNumber: form.idNumber.trim(),
                unitCode: selectedUnitId,
                moveInDate: form.moveInDate,
                depositAmount: 0,
                paperwork: form.paperwork,
                propertyId: selectedPropertyId,
                isExistingTenant: form.isExistingTenant
            });

            if (form.sendWelcomeSMS && created && (created.tenantId || created.id)) {
                try {
                    await sendReminders([created.tenantId || created.id]);
                } catch (smsErr) {
                    console.error('Welcome SMS Error:', smsErr);
                }
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1800);
        } catch (err) {
            setError(err.message || 'Failed to onboard tenant.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="modal max-w-5xl">
                    <div className="modal-header px-8 py-5 bg-[#F8FAFC]">
                        <div>
                            <h2 className="modal-title uppercase tracking-[0.15em] text-[11px]">Onboard New Tenant</h2>
                            <p className="text-[9px] font-bold text-[#94A3B8] mt-1.5 uppercase tracking-widest">
                                {property?.propertyName || (propertyId ? 'Loading...' : 'Select Property & Unit')}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-md text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="modal-body p-8">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-10 animate-zoom-in">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-base font-bold text-[#0F172A]">Tenant Onboarded!</h3>
                                <p className="text-xs text-[#64748B] mt-1">Tenant assigned successfully.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded text-[11px] font-medium text-red-600">
                                        {error}
                                    </div>
                                )}

                                {/* Property & Unit Selection Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {!propertyId && (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Property</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                                <select
                                                    value={selectedPropertyId}
                                                    onChange={handlePropertyChange}
                                                    className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none appearance-none"
                                                    required
                                                >
                                                    <option value="">Select Property...</option>
                                                    {properties.map(p => (
                                                        <option key={p.id} value={p.id}>{p.propertyName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Unit</label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <select
                                                value={selectedUnitId}
                                                onChange={e => setSelectedUnitId(e.target.value)}
                                                disabled={!selectedPropertyId}
                                                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none appearance-none disabled:opacity-50"
                                                required
                                            >
                                                <option value="">{selectedPropertyId ? 'Select Unit...' : 'Select Property First'}</option>
                                                {vacantUnits.map(u => (
                                                    <option key={u.unitId || u.unitCode} value={u.unitId || u.unitCode}>
                                                        {u.unitId || u.unitName} — KES {Number(u.rentAmount).toLocaleString()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Tenant Name & Phone Number Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input
                                                type="text"
                                                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none"
                                                placeholder="Jane Doe"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input
                                                type="tel"
                                                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none"
                                                placeholder="07XX XXX XXX"
                                                value={form.phone}
                                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ID Number, Move-in Date Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">ID / Passport Number</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input
                                                type="text"
                                                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none"
                                                placeholder="National ID or Passport"
                                                value={form.idNumber}
                                                onChange={e => setForm({ ...form, idNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">Move-in Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                                            <input
                                                type="date"
                                                className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-md text-[13px] font-medium text-[#0F172A] focus:border-[#007AFF] outline-none"
                                                value={form.moveInDate}
                                                onChange={e => setForm({ ...form, moveInDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Required Paperwork & Tenant Classification */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-[#F1F5F9]">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                                            <FileCheck size={14} />
                                            Required Paperwork
                                        </label>
                                        <div className="flex flex-wrap gap-5">
                                            {[
                                                { key: 'copyId', label: 'Copy of ID' },
                                                { key: 'signedAgreement', label: 'Signed Agreement' },
                                                { key: 'passportPhoto', label: 'Passport Photo' },
                                            ].map(({ key, label }) => (
                                                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.paperwork?.[key] || false}
                                                        onChange={() => setForm({
                                                            ...form,
                                                            paperwork: {
                                                                ...form.paperwork,
                                                                [key]: !form.paperwork[key]
                                                            }
                                                        })}
                                                        className="w-4 h-4 rounded-sm border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer"
                                                    />
                                                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider group-hover:text-[#0F172A] transition-colors">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                                            <User size={14} />
                                            Tenant Classification
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 rounded-md hover:bg-slate-50 transition-colors self-start">
                                            <input
                                                type="checkbox"
                                                checked={form.isExistingTenant || false}
                                                onChange={() => setForm({
                                                    ...form,
                                                    isExistingTenant: !form.isExistingTenant
                                                })}
                                                className="w-4 h-4 rounded-sm border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer"
                                            />
                                            <div>
                                                <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider group-hover:text-[#007AFF] transition-colors">Existing Tenant (Pre-system)</span>
                                                <p className="text-[9px] text-[#64748B] mt-0.5 uppercase tracking-wider font-semibold">Exempts security deposit requirement</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                    {form.name && (
                                        <div className="flex flex-wrap gap-2.5">
                                            {form.phone && (
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, sendWelcomeSMS: !form.sendWelcomeSMS })}
                                                    className={`flex items-center gap-1.5 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                                        form.sendWelcomeSMS
                                                            ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm'
                                                            : 'bg-[#007AFF]/5 text-[#007AFF] border border-[#007AFF]/10 hover:bg-[#007AFF] hover:text-white transition-all shadow-sm'
                                                    }`}
                                                >
                                                    <Send size={12} />
                                                    {form.sendWelcomeSMS ? 'Welcome SMS Queued' : 'Queue Welcome SMS'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setPreviewUnit({
                                                    unitId: selectedUnitId || 'UNIT-X',
                                                    category: selectedUnit?.category || 'Residential',
                                                    rentAmount: selectedUnit?.rentAmount || 0,
                                                    depositAmount: form.isExistingTenant ? 0 : (selectedUnit?.rentAmount || 0),
                                                    utilityFees: selectedUnit?.utilityFees || {},
                                                    tenant: {
                                                        name: form.name,
                                                        phone: form.phone,
                                                        idNumber: form.idNumber,
                                                        moveInDate: form.moveInDate,
                                                    }
                                                })}
                                                className="flex items-center gap-1.5 h-9 px-4 bg-white text-[#0F172A] border border-[#E2E8F0] rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#F8FAFC] transition-all shadow-sm cursor-pointer"
                                            >
                                                <FileText size={12} />
                                                Preview Agreement
                                            </button>
                                        </div>
                                    )}


                                <div className="pt-4 flex gap-4 justify-end">
                                    <button type="button" onClick={onClose} className="h-11 px-6 bg-[#F1F5F9] text-[#64748B] rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-[#E2E8F0] cursor-pointer">Cancel</button>
                                    <button type="submit" disabled={submitting} className="h-11 px-8 bg-[#007AFF] text-white rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 shadow-lg shadow-blue-100 cursor-pointer">
                                        {submitting ? 'Onboarding...' : 'Onboard Tenant'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {previewUnit && (
                <AgreementModal
                    unit={previewUnit}
                    propertyName={property?.propertyName || 'KodiPay Property'}
                    address={property?.address || 'Nairobi, Kenya'}
                    agencyName={agencyName}
                    onClose={() => setPreviewUnit(null)}
                />
            )}
        </>
    );
}
