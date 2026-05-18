import React from 'react';
import { Building2, MapPin, User, Phone, Percent, Info } from 'lucide-react';

const PropertyForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
            <Building2 size={14} />
            Property Name
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName}
            onChange={handleChange}
            className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            placeholder="e.g. Sunrise Apartments"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
            <MapPin size={14} />
            Location / Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            placeholder="e.g. Ngong Road, Nairobi"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
            <Percent size={14} />
            Agency Commission (%)
          </label>
          <input
            type="number"
            name="agencyCommission"
            value={formData.agencyCommission}
            onChange={handleChange}
            className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            placeholder="8"
          />
          <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 flex items-start gap-2.5">
            <Info className="text-[#007AFF] shrink-0 mt-0.5" size={14} />
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              <span className="font-bold text-[#0F172A]">Note:</span> The agency commission is used to automatically calculate management fee deductions in your monthly statements. You can update these rate settings later in the property administration settings panel.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 mt-10 pt-10 border-t border-[#F1F5F9]">
          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-8">Caretaker Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
                <User size={14} />
                Caretaker Name
              </label>
              <input
                type="text"
                name="caretaker.name"
                value={formData.caretaker.name}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
                <Phone size={14} />
                Caretaker Phone
              </label>
              <input
                type="tel"
                name="caretaker.phone"
                value={formData.caretaker.phone}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                placeholder="07..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
