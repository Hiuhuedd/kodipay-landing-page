'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Zap, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getSmsUsage, purchaseSmsPlan } from '@/lib/api';

const BUNDLES = [
  { id: 'starter', units: 500, price: 1000, label: 'Starter Bundle', desc: 'Perfect for small agencies' },
  { id: 'standard', units: 2000, price: 3500, label: 'Standard Bundle', desc: 'Most popular for growing teams', popular: true },
  { id: 'pro', units: 5000, price: 7500, label: 'Professional', desc: 'Maximum reach for large portfolios' },
];

export default function SmsPlansPage() {
  const [stats, setStats] = useState({ monthlySent: 0, monthlyLimit: 0, totalSent: 0 });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await getSmsUsage();
      if (res.success) setStats(res.data);
    } catch (err) {
      setError('Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (bundle) => {
    setPurchasing(bundle.id);
    setError('');
    try {
      const res = await purchaseSmsPlan(bundle.id, bundle.units);
      if (res.success) {
        setStats({ ...stats, monthlyLimit: res.data.newLimit });
        setSuccess(`Successfully added ${bundle.units} units to your quota!`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Payment simulation failed');
    } finally {
      setPurchasing(false);
    }
  };

  const usagePercent = stats.monthlyLimit > 0 ? Math.round((stats.monthlySent / stats.monthlyLimit) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">SMS Usage</h1>
              <p className="text-sm text-neutral-500">Your current monthly quota and reach</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-neutral-900">{stats.monthlySent.toLocaleString()}</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Units Sent</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-lg font-bold text-neutral-400">/ {stats.monthlyLimit.toLocaleString()}</span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Monthly Limit</span>
              </div>
            </div>

            <div className="relative h-4 bg-neutral-50 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-black text-neutral-400 uppercase tracking-widest pt-2">
              <span>{usagePercent}% Used</span>
              <span>{stats.monthlyLimit - stats.monthlySent} remaining</span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-[32px] p-8 text-white flex flex-col justify-between">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
                <h3 className="text-xl font-bold">Auto-Refill</h3>
                <p className="text-xs text-white/50 mt-1">Never run out of units during critical rent collection days.</p>
            </div>
            <button className="w-full py-3 bg-white text-neutral-900 rounded-2xl font-bold text-sm hover:bg-neutral-100 transition-all">
                Enable Now
            </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-bold text-sm animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Bundles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Top-up Bundles</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" /> Best Value
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BUNDLES.map(bundle => (
            <div key={bundle.id} className={`relative bg-white border rounded-[28px] p-8 transition-all hover:shadow-xl group ${
                bundle.popular ? 'border-indigo-600 shadow-lg shadow-indigo-100' : 'border-neutral-100'
            }`}>
              {bundle.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Recommended
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-neutral-900">{bundle.label}</h3>
                <p className="text-xs text-neutral-500 mt-1 min-h-[32px]">{bundle.desc}</p>
                
                <div className="mt-8 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-neutral-900">KES {bundle.price.toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-indigo-600 mt-1">+{bundle.units.toLocaleString()} units</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {['Instant Activation', 'No Expiry', 'Priority Support'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handlePurchase(bundle)}
                  disabled={purchasing}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    bundle.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {purchasing === bundle.id ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Purchase <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-neutral-50 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                  <h4 className="font-bold text-neutral-900">Secure Payments</h4>
                  <p className="text-xs text-neutral-500">All transactions are encrypted and processed via official Paybill.</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-neutral-400 border border-neutral-100 uppercase tracking-widest">M-Pesa</div>
              <div className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-neutral-400 border border-neutral-100 uppercase tracking-widest">Visa</div>
          </div>
      </div>

    </div>
  );
}
