import React from 'react';
import { Plus, Trash2, Home, Hash, DollarSign, Tag, Copy, AlertCircle } from 'lucide-react';

const UnitsForm = ({ formData, setFormData }) => {
  const addUnit = () => {
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          unitId: `Unit ${formData.units.length + 1}`,
          unitName: `Unit ${formData.units.length + 1}`,
          rentAmount: '',
          depositAmount: '',
          category: 'Standard',
          utilityFees: { garbageFee: 200, waterBill: 0, electricityBill: 0 }
        }
      ]
    });
  };

  const removeUnit = (index) => {
    const newUnits = formData.units.filter((_, i) => i !== index);
    setFormData({ ...formData, units: newUnits });
  };

  const duplicateUnit = (index) => {
    const sourceUnit = formData.units[index];
    const baseId = sourceUnit.unitId;
    let newId = `${baseId} (Copy)`;
    let counter = 1;

    // Ensure uniqueness
    while (formData.units.some(u => u.unitId === newId)) {
      newId = `${baseId} (Copy ${counter})`;
      counter++;
    }

    const newUnit = {
      ...JSON.parse(JSON.stringify(sourceUnit)),
      unitId: newId,
      unitName: newId
    };

    setFormData({
      ...formData,
      units: [...formData.units, newUnit]
    });
  };

  const updateUnit = (index, field, value) => {
    const newUnits = [...formData.units];
    if (field === 'unitId') {
      newUnits[index].unitId = value;
      newUnits[index].unitName = value; // Keep in sync!
    } else if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newUnits[index][parent] = { ...newUnits[index][parent], [child]: value };
    } else {
      newUnits[index][field] = value;
    }
    setFormData({ ...formData, units: newUnits });
  };

  return (
    <div className="space-y-10 max-w-none mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Configure Units</h2>
          <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Add individual units and set their financial details</p>
        </div>
        <button
          onClick={addUnit}
          className="flex items-center gap-2 h-10 px-5 bg-[#0F172A] text-white rounded-md transition-all shadow-sm font-semibold text-[13px] hover:bg-black"
        >
          <Plus size={16} />
          Add Unit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {formData.units.map((unit, index) => (
          <div key={index} className="bg-white border border-[#E2E8F0] rounded-md p-6 relative group transition-all hover:border-[#007AFF] hover:shadow-sm">
            <div className="absolute -top-3 -left-3 bg-[#0F172A] text-white w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold shadow-md z-10">
              {index + 1}
            </div>
            
            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => duplicateUnit(index)}
                className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-all shadow-sm"
                title="Duplicate Unit"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => removeUnit(index)}
                className="p-1.5 rounded bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                title="Remove Unit"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Unit No / ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                  <input
                    type="text"
                    value={unit.unitId}
                    onChange={(e) => updateUnit(index, 'unitId', e.target.value)}
                    className={`w-full h-10 pl-9 pr-3 bg-white border rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium transition-all ${formData.units.filter((u, i) => i !== index && u.unitId === unit.unitId).length > 0
                        ? 'border-red-300 text-red-600 bg-red-50/30'
                        : 'border-[#E2E8F0]'
                      }`}
                    placeholder="101"
                  />
                </div>
                {formData.units.filter((u, i) => i !== index && u.unitId === unit.unitId).length > 0 && (
                  <p className="text-[9px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> Duplicate unit ID
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Monthly Rent</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                  <input
                    type="number"
                    value={unit.rentAmount}
                    onChange={(e) => updateUnit(index, 'rentAmount', e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Rent Deposit</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                  <input
                    type="number"
                    value={unit.depositAmount}
                    onChange={(e) => updateUnit(index, 'depositAmount', e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                  <select
                    value={unit.category}
                    onChange={(e) => updateUnit(index, 'category', e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none text-[13px] font-medium appearance-none"
                  >
                    <option value="Standard">Standard</option>
                    {/* Maisonettes & Villas */}
                    <option value="6 Bedroom Maisonette">6 Bedroom Maisonette</option>
                    <option value="5 Bedroom Maisonette">5 Bedroom Maisonette</option>
                    <option value="4 Bedroom Maisonette">4 Bedroom Maisonette</option>
                    <option value="3 Bedroom Maisonette">3 Bedroom Maisonette</option>
                    <option value="2 Bedroom Maisonette">2 Bedroom Maisonette</option>
                    <option value="6 Bedroom Villa / Townhouse">6 Bedroom Villa / Townhouse</option>
                    <option value="5 Bedroom Villa / Townhouse">5 Bedroom Villa / Townhouse</option>
                    <option value="4 Bedroom Villa / Townhouse">4 Bedroom Villa / Townhouse</option>
                    <option value="3 Bedroom Villa / Townhouse">3 Bedroom Villa / Townhouse</option>
                    
                    {/* Bungalows */}
                    <option value="5 Bedroom Bungalow">5 Bedroom Bungalow</option>
                    <option value="4 Bedroom Bungalow">4 Bedroom Bungalow</option>
                    <option value="3 Bedroom Bungalow">3 Bedroom Bungalow</option>
                    <option value="2 Bedroom Bungalow">2 Bedroom Bungalow</option>

                    {/* Apartments & Penthouses */}
                    <option value="Penthouse">Penthouse</option>
                    <option value="5 Bedroom Apartment">5 Bedroom Apartment</option>
                    <option value="4 Bedroom Apartment">4 Bedroom Apartment</option>
                    <option value="3 Bedroom Apartment">3 Bedroom Apartment</option>
                    <option value="2 Bedroom Apartment">2 Bedroom Apartment</option>
                    <option value="1 Bedroom Apartment">1 Bedroom Apartment</option>

                    {/* Compact / Shared Residential */}
                    <option value="Studio Apartment">Studio Apartment</option>
                    <option value="Bedsitter">Bedsitter</option>
                    <option value="Single Room">Single Room</option>
                    <option value="Double Room">Double Room</option>
                    <option value="Hostel Room">Hostel Room</option>

                    {/* Commercial Units */}
                    <option value="Shop">Shop</option>
                    <option value="Stall">Stall</option>
                    <option value="Office Space">Office Space</option>
                    <option value="Warehouse / Godown">Warehouse / Godown</option>
                    <option value="Showroom">Showroom</option>
                    <option value="Storage Unit">Storage Unit</option>
                    <option value="Parking Space">Parking Space</option>
                    
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Garbage Fee (KES)</label>
                <input
                  type="number"
                  value={unit.utilityFees.garbageFee}
                  onChange={(e) => updateUnit(index, 'utilityFees.garbageFee', e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:border-[#007AFF] focus:bg-white outline-none text-[12px] font-medium tabular-nums transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Default Water Bill (KES)</label>
                <input
                  type="number"
                  value={unit.utilityFees.waterBill}
                  onChange={(e) => updateUnit(index, 'utilityFees.waterBill', e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md focus:border-[#007AFF] focus:bg-white outline-none text-[12px] font-medium tabular-nums transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {formData.units.length === 0 && (
        <div className="py-20 border border-dashed border-[#E2E8F0] rounded-lg flex flex-col items-center justify-center text-[#94A3B8] bg-[#F8FAFC]/50">
          <Home size={40} className="mb-4 opacity-30" />
          <p className="text-xs font-bold uppercase tracking-widest">No units configured</p>
          <button onClick={addUnit} className="mt-4 text-[#007AFF] font-bold text-xs uppercase tracking-widest hover:underline">Add your first unit</button>
        </div>
      )}
    </div>
  );
};

export default UnitsForm;
