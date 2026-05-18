'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Loader2, AlertCircle } from 'lucide-react';
import { createProperty, createTenant, sendReminders } from '@/lib/api';
import Stepper from '@/components/properties/Stepper';
import PropertyForm from '@/components/properties/PropertyForm';
import OwnerForm from '@/components/properties/OwnerForm';
import UnitsForm from '@/components/properties/UnitsForm';
import TenantsForm from '@/components/properties/TenantsForm';

const STEPS = [
  { id: 'property', title: 'Property Details' },
  { id: 'owner', title: 'Owner Details' },
  { id: 'units', title: 'Setup Units' },
  { id: 'tenants', title: 'Assign Tenants' },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');

  const [formData, setFormData] = useState({
    propertyName: '',
    address: '',
    caretaker: { name: '', phone: '' },
    owner: {
      name: '',
      phone: '',
      email: '',
      bankDetails: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        branch: '',
        mpesaNumber: '',
      }
    },
    agencyCommission: 8,
    waterMeterSettings: { meterType: 'single', costPerUnit: 0 },
    units: []
  });

  const nextStep = () => {
    if (currentStep === 0) {
      if (!formData.propertyName) {
        setError('Please provide a name for this property (e.g., Sunrise Apartments)');
        return;
      }
      if (!formData.address) {
        setError('Please provide the physical location or address of the property');
        return;
      }
      if (formData.caretaker?.phone && formData.caretaker.phone.length < 10) {
        setError('If providing a caretaker, their phone number must be at least 10 digits');
        return;
      }
    }

    if (currentStep === 2) {
      if (formData.units.length === 0) {
        setError('Please add at least one unit before proceeding to tenant assignment');
        return;
      }
    }

    setError(null);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const propertyPayload = {
        propertyName: formData.propertyName,
        address: formData.address,
        caretaker: formData.caretaker,
        owner: formData.owner,
        agencyCommission: formData.agencyCommission,
        waterMeterSettings: formData.waterMeterSettings,
        units: formData.units.map(u => ({
          unitId: u.unitId,
          unitName: u.unitName || u.unitId,
          rentAmount: Number(u.rentAmount),
          depositAmount: Number(u.depositAmount),
          category: u.category,
          utilityFees: {
            garbageFee: Number(u.utilityFees?.garbageFee || 0),
            waterBill: Number(u.utilityFees?.waterBill || 0),
          }
        }))
      };

      const propertyRes = await createProperty(propertyPayload);
      const propertyId = propertyRes.propertyId;

      const tenantPromises = formData.units
        .filter(u => u.tenant && u.tenant.name && u.tenant.phone)
        .map(u => createTenant({
          name: u.tenant.name,
          phone: u.tenant.phone,
          idNumber: u.tenant.idNumber || '',
          unitCode: u.unitId,
          moveInDate: u.tenant.moveInDate,
          paperwork: u.tenant.paperwork,
          propertyId,
        }));

      if (tenantPromises.length > 0) {
        const createdTenants = await Promise.all(tenantPromises);
        
        // Find which drafted units in formData had "sendWelcomeSMS" active
        const welcomeTenantIds = [];
        formData.units
          .filter(u => u.tenant && u.tenant.name && u.tenant.phone)
          .forEach((u, idx) => {
            if (u.tenant.sendWelcomeSMS) {
              const created = createdTenants[idx];
              if (created && (created.tenantId || created.id)) {
                welcomeTenantIds.push(created.tenantId || created.id);
              }
            }
          });

        if (welcomeTenantIds.length > 0) {
          try {
            await sendReminders(welcomeTenantIds);
          } catch (smsErr) {
            console.error('Failed to dispatch welcome SMS messages:', smsErr);
          }
        }
      }

      router.push('/dashboard/properties');
      router.refresh();
    } catch (err) {
      console.warn('Registration failed:', err.message || err);
      const isLimitError = err.message && err.message.toLowerCase().includes('limit exceeded');
      if (isLimitError) {
        setUpgradeModalMessage(err.message);
        setShowUpgradeModal(true);
      } else {
        setError(err.message || 'Failed to create property. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <PropertyForm formData={formData} setFormData={setFormData} />;
      case 1: return <OwnerForm formData={formData} setFormData={setFormData} />;
      case 2: return <UnitsForm formData={formData} setFormData={setFormData} />;
      case 3: return <TenantsForm formData={formData} setFormData={setFormData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">New Property Registration</h1>
            <p className="text-[#64748B] text-xs mt-1 uppercase tracking-widest">Complete the steps below to onboard your property</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-[#64748B] hover:text-[#0F172A] text-xs font-medium uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            Cancel
          </button>
        </div>

        <Stepper steps={STEPS} currentStep={currentStep} />

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md flex items-center gap-3 animate-in fade-in zoom-in-95">
            <AlertCircle size={16} />
            <span className="text-[13px] font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 shadow-sm min-h-[400px]">
          {renderStep()}
        </div>

        {/* Floating Navigation Controls */}
        <div className="fixed bottom-8 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between pointer-events-auto">
            <button
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className={`flex items-center gap-2 h-11 px-6 rounded-md text-[13px] font-semibold transition-all shadow-lg ${
                currentStep === 0 || isSubmitting
                ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
                : 'bg-white text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || formData.units.length === 0}
                className="flex items-center gap-2 h-11 px-8 bg-[#0F172A] text-white rounded-md text-[13px] font-semibold transition-all shadow-lg hover:bg-black disabled:bg-[#CBD5E1]"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating Property...</>
                ) : (
                  <><Save size={18} /> Complete Registration</>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={isSubmitting}
                className="flex items-center gap-2 h-11 px-8 bg-[#007AFF] text-white rounded-md text-[13px] font-semibold transition-all shadow-lg hover:bg-blue-600 shadow-blue-200/50"
              >
                Next Step
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Premium Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="p-2 bg-amber-50 rounded-full">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A]">Upgrade Plan Required</h3>
              </div>
              
              <p className="text-[#64748B] text-[13px] leading-relaxed mb-6">
                {upgradeModalMessage}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 h-10 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded-md text-[13px] font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push('/dashboard/billing');
                  }}
                  className="flex-1 h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-md text-[13px] font-semibold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
