import React from 'react';
import { User, Phone, CreditCard, Landmark, Hash, MapPin } from 'lucide-react';

const KENYAN_BANKS = [
  // Tier 1 Commercial Banks
  'KCB Bank Kenya', 'Equity Bank Kenya', 'Co-operative Bank of Kenya',
  'NCBA Bank Kenya', 'Absa Bank Kenya', 'Standard Chartered Kenya',
  'I&M Bank', 'Diamond Trust Bank (DTB)', 'Family Bank',
  'National Bank of Kenya', 'Prime Bank Kenya', 'Gulf African Bank',
  'Bank of Africa Kenya', 'HF Group', 'Sidian Bank',
  'SBM Bank Kenya', 'Access Bank Kenya', 'Ecobank Kenya',
  'Bank of Baroda Kenya', 'Citibank Kenya', 'Stanbic Bank Kenya',
  'UBA Kenya Bank', 'Victoria Commercial Bank', 'Mayfair CIB Bank',
  'Middle East Bank Kenya', 'African Banking Corporation',
  'Consolidated Bank of Kenya', 'Credit Bank Kenya', 'Development Bank of Kenya',
  'Trans National Bank Kenya', 'Kingdom Bank',
  // Tier 2 & 3
  'Paramount Bank', 'Spire Bank', 'Guardian Bank', 'Habib Bank AG Zurich',
  'Habib Bank Ltd', 'Commercial Bank of Africa', 'Chase Bank Kenya (In receivership)',
  // Major SACCOs
  'Stima SACCO', 'Mwalimu National SACCO', 'Kenya Police SACCO',
  'Unaitas SACCO', 'Tower SACCO', 'Imarika SACCO', 'Afya SACCO',
  'Harambee SACCO', 'Kenya Bankers SACCO', 'UN SACCO',
  'Kimisitu SACCO', 'Boresha SACCO', 'Fortune SACCO', 'Hazina SACCO',
  'Jamii SACCO', 'Mentor SACCO', 'Metropolitan SACCO', 'Magereza SACCO',
  'KenGen SACCO', 'Kenya Post Office SACCO', 'Safaricom SACCO',
  'Nation SACCO', 'Waumini SACCO', 'Chai SACCO', 'KUSCCO',
  // Mobile Money / Digital
  'M-Pesa (Safaricom)', 'Airtel Money', 'T-Kash (Telkom)',
];

const OwnerForm = ({ formData, setFormData }) => {
  const [clients, setClients] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('@/lib/api').then(({ fetchAPI }) => {
      fetchAPI('/clients')
        .then(res => {
          setClients(res.data || []);
        })
        .catch(err => console.error('Failed to load landlord clients:', err))
        .finally(() => setLoading(false));
    });
  }, []);

  // Deep recursive merge handler for nested fields (e.g. "owner.bankDetails.accountName")
  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    setFormData(prev => {
      const updated = { ...prev };
      let ref = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...(ref[keys[i]] || {}) };
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return { ...updated };
    });
  };

  const owner = formData.owner || {};
  const bank = owner.bankDetails || {};

  return (
    <div className="space-y-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-xl font-semibold text-[#0F172A] tracking-tight">Owner Details</h2>
        <p className="text-xs text-[#64748B] mt-1 uppercase tracking-widest">Enter the property owner's contact and banking information</p>
      </div>

      {/* Personal Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Select Landlord Client Profile</h3>
          <div className="h-px flex-1 bg-[#E2E8F0]"></div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
            <User size={14} className="text-[#007AFF]" />
            Landlord Profile Link
          </label>
          {loading ? (
            <div className="h-11 bg-slate-50 border border-[#E2E8F0] rounded-md flex items-center px-4 text-xs text-[#94A3B8] animate-pulse">
              Loading agency landlord list...
            </div>
          ) : (
            <select
              value={owner.id || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setFormData(prev => ({
                    ...prev,
                    owner: {
                      id: '',
                      name: '',
                      phone: '',
                      email: '',
                      bankDetails: {
                        bankName: '',
                        accountName: '',
                        accountNumber: '',
                        branch: '',
                        mpesaNumber: ''
                      }
                    }
                  }));
                  return;
                }
                const client = clients.find(c => c.id === selectedId);
                if (client) {
                  setFormData(prev => ({
                    ...prev,
                    owner: {
                      id: client.id,
                      name: client.name,
                      phone: client.phone || '',
                      email: client.email || '',
                      bankDetails: {
                        bankName: client.payoutMethod === 'bank' ? (client.payoutDetails?.split(' - ')[0] || 'Equity Bank Kenya') : '',
                        accountName: client.name,
                        accountNumber: client.payoutMethod === 'bank' ? (client.payoutDetails || '') : '',
                        branch: '',
                        mpesaNumber: client.payoutMethod === 'mpesa' ? (client.payoutDetails || client.phone || '') : ''
                      }
                    }
                  }));
                }
              }}
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
            >
              <option value="">-- Create a new landlord profile manually --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || 'No email'})
                </option>
              ))}
            </select>
          )}
          <p className="text-[10px] text-[#94A3B8]">
            Tip: Link to an existing client to automatically track and manage their property payouts!
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Contact & Personal Details</h3>
          <div className="h-px flex-1 bg-[#E2E8F0]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <User size={14} />
              Full Name
            </label>
            <input
              type="text"
              name="owner.name"
              value={owner.name || ''}
              onChange={handleChange}
              placeholder="e.g. John Kamau"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <Phone size={14} />
              Phone Number
            </label>
            <input
              type="tel"
              name="owner.phone"
              value={owner.phone || ''}
              onChange={handleChange}
              placeholder="07XX XXX XXX"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <MapPin size={14} />
              Email Address
            </label>
            <input
              type="email"
              name="owner.email"
              value={owner.email || ''}
              onChange={handleChange}
              placeholder="owner@email.com"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Banking & Remittance</h3>
          <div className="h-px flex-1 bg-[#E2E8F0]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <Landmark size={14} />
              Bank / SACCO Name
            </label>
            <input
              type="text"
              name="owner.bankDetails.bankName"
              value={bank.bankName || ''}
              onChange={handleChange}
              placeholder="Search bank or SACCO..."
              list="kenyan-banks-list"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <datalist id="kenyan-banks-list">
              {KENYAN_BANKS.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <User size={14} />
              Account Name
            </label>
            <input
              type="text"
              name="owner.bankDetails.accountName"
              value={bank.accountName || ''}
              onChange={handleChange}
              placeholder="Account holder name"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <CreditCard size={14} />
              Account Number
            </label>
            <input
              type="text"
              name="owner.bankDetails.accountNumber"
              value={bank.accountNumber || ''}
              onChange={handleChange}
              placeholder="XXXX XXXX XXXX"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <MapPin size={14} />
              Branch
            </label>
            <input
              type="text"
              name="owner.bankDetails.branch"
              value={bank.branch || ''}
              onChange={handleChange}
              placeholder="e.g. Westlands Branch"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] flex items-center gap-2">
              <Hash size={14} />
              M-Pesa / Paybill
            </label>
            <input
              type="text"
              name="owner.bankDetails.mpesaNumber"
              value={bank.mpesaNumber || ''}
              onChange={handleChange}
              placeholder="07XX XXX XXX or Paybill"
              className="w-full h-11 px-4 bg-white border border-[#E2E8F0] rounded-md focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
          <div className="p-1.5 bg-white rounded border border-[#E2E8F0]">
            <Landmark size={14} className="text-[#007AFF]" />
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            <span className="font-bold text-[#0F172A]">Note:</span> Banking details are used for automated rent remittance. You can update these settings later in the property administration panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerForm;
