'use client';

import React, { useState } from 'react';
import { UserPlus, User, Phone, Calendar, UserMinus, FileCheck, FileText, Printer, X, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// ── Agreement Preview Modal ──────────────────────────────────────────────────
// ── Agreement Preview Modal ──────────────────────────────────────────────────
function AgreementModal({ unit, formData, agencyName, onClose }) {
  const tenant = unit.tenant;
  const today = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' });
  const moveIn = tenant.moveInDate
    ? new Date(tenant.moveInDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '_______________';

  const contractId = `KP-${unit.unitId.replace(/\s+/g, '').toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-md shadow-2xl overflow-hidden border border-[#E2E8F0]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-[0.15em]">Tenancy Agreement</h2>
            <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mt-1">{contractId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-9 px-4 bg-[#0F172A] text-white rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm"
            >
              <Printer size={14} /> Print Document
            </button>
            <button onClick={onClose} className="p-2 rounded-md text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
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
                <p className="text-[12px] font-bold text-[#0F172A] mt-0.5">{formData.propertyName || '_______________'}</p>
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
                <span className="font-semibold text-[#0F172A]">{formData.propertyName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Location</span>
                <span className="font-semibold text-[#0F172A]">{formData.address}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8] text-[10px] uppercase tracking-widest">Unit</span>
                <span className="font-semibold text-[#0F172A]">{unit.unitId} ({unit.category})</span>
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
              ["Agency Obligations", `${agencyName || 'The Managing Agency'} shall ensure the unit is habitable and provide digital receipts for all payments.`],
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

// ── Main TenantsForm ─────────────────────────────────────────────────────────
const TenantsForm = ({ formData, setFormData }) => {
  const { user } = useAuth();
  const agencyName = user?.agencyName || '';
  const [previewUnit, setPreviewUnit] = useState(null);

  const toggleTenant = (unitIndex) => {
    const newUnits = [...formData.units];
    if (newUnits[unitIndex].tenant) {
      delete newUnits[unitIndex].tenant;
    } else {
      newUnits[unitIndex].tenant = {
        name: '',
        phone: '',
        idNumber: '',
        moveInDate: new Date().toISOString().split('T')[0],
        paperwork: { copyId: false, signedAgreement: false, passportPhoto: false },
        isExistingTenant: false
      };
    }
    setFormData({ ...formData, units: newUnits });
  };

  const updateTenant = (unitIndex, field, value) => {
    const newUnits = [...formData.units];
    newUnits[unitIndex].tenant = { ...newUnits[unitIndex].tenant, [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  const togglePaperwork = (unitIndex, field) => {
    const newUnits = [...formData.units];
    newUnits[unitIndex].tenant.paperwork = {
      ...newUnits[unitIndex].tenant.paperwork,
      [field]: !newUnits[unitIndex].tenant.paperwork[field]
    };
    setFormData({ ...formData, units: newUnits });
  };

  const handleSendWelcomeSMS = (unitIndex) => {
    const newUnits = [...formData.units];
    const currentVal = !!newUnits[unitIndex].tenant.sendWelcomeSMS;
    newUnits[unitIndex].tenant.sendWelcomeSMS = !currentVal;
    setFormData({ ...formData, units: newUnits });
  };

  return (
    <>
      <div className="space-y-10 max-w-none mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Assign Tenants</h2>
          <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Optionally assign tenants and generate tenancy agreements</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {formData.units.map((unit, index) => (
            <div key={index} className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden transition-all hover:border-[#007AFF] hover:shadow-sm">
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-md flex items-center justify-center font-bold text-[13px] shadow-sm">
                    {unit.unitId}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-[#0F172A]">{unit.category}</span>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">
                      KES {Number(unit.rentAmount).toLocaleString()} / month
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleTenant(index)}
                  className={`flex items-center gap-2 h-9 px-4 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${unit.tenant
                    ? 'text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100'
                    : 'text-[#007AFF] bg-blue-50 hover:bg-[#007AFF] hover:text-white border border-blue-100'
                  }`}
                >
                  {unit.tenant
                    ? <><UserMinus size={14} /> Remove</>
                    : <><UserPlus size={14} /> Assign</>
                  }
                </button>
              </div>

              {unit.tenant && (
                <div className="p-8 space-y-8 animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Tenant Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                        <input
                          type="text"
                          value={unit.tenant.name || ''}
                          onChange={(e) => updateTenant(index, 'name', e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium"
                          placeholder="Jane Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                        <input
                          type="tel"
                          value={unit.tenant.phone || ''}
                          onChange={(e) => updateTenant(index, 'phone', e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium tabular-nums"
                          placeholder="07..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">ID / Passport Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                        <input
                          type="text"
                          value={unit.tenant.idNumber || ''}
                          onChange={(e) => updateTenant(index, 'idNumber', e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium"
                          placeholder="ID or Passport"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Move-in Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                        <input
                          type="date"
                          value={unit.tenant.moveInDate || ''}
                          onChange={(e) => updateTenant(index, 'moveInDate', e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                        <FileCheck size={14} />
                        Required Paperwork
                      </label>
                      <div className="flex flex-wrap gap-6">
                        {[
                          { key: 'copyId', label: 'Copy of ID' },
                          { key: 'signedAgreement', label: 'Signed Agreement' },
                          { key: 'passportPhoto', label: 'Passport Photo' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={unit.tenant.paperwork?.[key] || false}
                              onChange={() => togglePaperwork(index, key)}
                              className="w-4 h-4 rounded-sm border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider group-hover:text-[#0F172A] transition-colors">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                        <User size={14} />
                        Tenant Classification
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 rounded-md hover:bg-slate-50 transition-colors self-start max-w-md">
                        <input
                          type="checkbox"
                          checked={unit.tenant.isExistingTenant || false}
                          onChange={() => updateTenant(index, 'isExistingTenant', !unit.tenant.isExistingTenant)}
                          className="w-4 h-4 rounded-sm border-[#E2E8F0] text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer"
                        />
                        <div>
                          <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider group-hover:text-[#007AFF] transition-colors">Existing Tenant (Pre-system)</span>
                          <p className="text-[9px] text-[#64748B] mt-0.5 uppercase tracking-wider font-semibold">Exempts security deposit requirement</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {unit.tenant.name && (
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-[#F1F5F9] justify-end">
                      {unit.tenant.phone && (
                        <button
                          type="button"
                          onClick={() => handleSendWelcomeSMS(index)}
                          className={`flex items-center gap-2 h-10 px-5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            unit.tenant.sendWelcomeSMS
                              ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm'
                              : 'bg-[#007AFF]/5 text-[#007AFF] border border-[#007AFF]/10 hover:bg-[#007AFF] hover:text-white transition-all shadow-sm'
                          }`}
                        >
                          <Send size={14} />
                          {unit.tenant.sendWelcomeSMS ? 'Welcome SMS Queued' : 'Queue Welcome SMS'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewUnit(unit)}
                        className="flex items-center gap-2 h-10 px-5 bg-white text-[#0F172A] border border-[#E2E8F0] rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-[#F8FAFC] transition-all shadow-sm cursor-pointer"
                      >
                        <FileText size={14} />
                        Preview Agreement
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {formData.units.length === 0 && (
          <div className="py-20 border border-dashed border-[#E2E8F0] rounded-lg text-center bg-[#F8FAFC]/50">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">No units available for assignment</p>
            <p className="text-xs text-[#64748B] mt-2">Please configure units in the previous step first.</p>
          </div>
        )}
      </div>

      {previewUnit && (
        <AgreementModal
          unit={previewUnit}
          formData={formData}
          agencyName={agencyName}
          onClose={() => setPreviewUnit(null)}
        />
      )}
    </>
  );
};

export default TenantsForm;
