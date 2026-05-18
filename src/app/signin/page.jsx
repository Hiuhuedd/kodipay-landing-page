'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import { sendVerification, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function SigninPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [authType, setAuthType] = useState('email'); // 'email' or 'phone'

  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });

  // OTP State (4 digits)
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const identifierRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
    if (e.key === 'Enter' && otp.every(v => v)) {
      handleVerify();
    }
  };

  const handleSendOtp = async () => {
    const identifier = authType === 'email' ? formData.email : formData.phone;

    if (authType === 'email' && !identifier.includes('@')) {
      return setError('Valid email required');
    }
    if (authType === 'phone' && identifier.length < 10) {
      return setError('Valid phone number required');
    }

    setLoading(true);
    setError('');

    try {
      await sendVerification(authType === 'email' ? identifier : null, authType === 'phone' ? identifier : null);
      setStep(2);
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 4) return setError('Enter 4-digit code');

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(
        authType === 'email' ? formData.email : null,
        authType === 'phone' ? formData.phone : null,
        otpString
      );

      if (res.success && res.data.verified) {
        if (res.data.newUser) {
          // Redirect to signup to complete profile
          router.push(`/signup?email=${formData.email}&phone=${formData.phone}&verified=true`);
        } else {
          // Successful Login
          login(res.data.token, res.data.user);
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 1) identifierRef.current?.focus();
    else otpRefs[0].current?.focus();
  }, [step, authType]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-white animate-in fade-in duration-500 select-none">
      {/* ── LEFT PANEL (AUTH FORM) ── */}
      <div className="w-full md:w-[60%] lg:w-[58%] h-full flex flex-col justify-between p-8 sm:p-16 lg:p-24 bg-white relative overflow-y-auto hide-scrollbar">
        {/* Mobile Header Branding (only visible when Right Panel is hidden) */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0F172A] flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base font-semibold tracking-[-0.02em] text-[#0F172A]">KodiPay</h1>
          </div>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-[9px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Change
            </button>
          )}
        </div>

        {/* Top desktop button */}
        <div className="hidden md:flex justify-start">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}
        </div>

        {/* Form area */}
        <div className="my-auto max-w-[360px] w-full mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-[#0F172A] tracking-[-0.03em]">
              {step === 1 ? 'Sign In' : 'Verification'}
            </h2>
            <p className="text-[#64748B] text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">
              {step === 1
                ? 'Access your administrative dashboard'
                : `Code sent to ${authType === 'email' ? formData.email : formData.phone}`}
            </p>
          </div>

          <div className="space-y-6 relative">
            {error && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* Auth Type Switcher */}
                <div className="flex bg-[#F1F5F9] p-1 rounded-md">
                  <button
                    onClick={() => setAuthType('email')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${authType === 'email' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]'}`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setAuthType('phone')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${authType === 'phone' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]'}`}
                  >
                    Phone SMS
                  </button>
                </div>

                <div className="space-y-6">
                  {authType === 'email' ? (
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Work Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF] transition-colors" />
                        <input
                          ref={identifierRef}
                          name="email"
                          type="email"
                          placeholder="name@agency.com"
                          value={formData.email}
                          onChange={handleChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                          className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF] transition-colors" />
                        <input
                          ref={identifierRef}
                          name="phone"
                          type="tel"
                          placeholder="0712 345 678"
                          value={formData.phone}
                          onChange={handleChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                          className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-[#0F172A] text-white rounded-md text-[13px] font-semibold hover:bg-black transition-all shadow-lg shadow-slate-200/50 disabled:bg-[#CBD5E1] disabled:shadow-none"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between gap-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full h-14 text-center text-2xl font-bold rounded-md bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#007AFF] focus:bg-white outline-none transition-all text-[#0F172A] tabular-nums"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-[#0F172A] text-white rounded-md text-[13px] font-semibold hover:bg-black transition-all shadow-lg shadow-slate-200/50 disabled:bg-[#CBD5E1]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Verify Account</span>
                    )}
                  </button>

                  <button
                    onClick={handleSendOtp}
                    className="w-full text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCcw className="w-3 h-3" /> Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-[#F1F5F9] flex flex-col items-center gap-4 text-center">
          <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">
            No Passwords Required · Secure OTP Sign-in
          </p>
          <div>
            <button
              onClick={() => router.push('/signup')}
              className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] uppercase tracking-widest transition-colors"
            >
              Don't have an account? <span className="text-[#007AFF]">Register now</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (HERO / BRANDING) ── */}
      <div className="hidden md:flex md:w-[40%] lg:w-[42%] h-full bg-gradient-to-br from-[#F4F9FF] via-[#EBF3FF] to-[#E1EDFF] flex-col justify-between p-16 text-slate-900 border-l border-[#D0E1FD]/40 relative overflow-hidden select-none">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#007AFF]/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-[#6366F1]/12 blur-[120px] pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#007AFF] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#007AFF]/25">
            <Building2 className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">KodiPay</span>
        </div>

        {/* Middle Mockup / Feature Visual */}
        <div className="my-auto space-y-10 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007AFF]/8 border border-[#007AFF]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Remittance Active</span>
            </div>
            <h2 className="text-3xl lg:text-[34px] font-semibold tracking-[-0.03em] leading-[1.2] text-[#0F172A]">
              Simple Rent Management. <br />
              <span className="text-[#007AFF]">Zero Administrative Friction.</span>
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
              Bring complete transparency and accountability to your property business. Automate rent collections, bills, and payouts with no paperwork.
            </p>
          </div>

          {/* High-fidelity minimal dashboard preview snippet */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xl shadow-slate-100/50 space-y-4 max-w-sm backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Global Collections</p>
                <p className="text-base font-bold text-[#0F172A] mt-0.5">KES 1,248,500 <span className="text-[9px] font-semibold text-emerald-600">+12.4%</span></p>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">
                ✓
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#64748B]">Owner Remittance</span>
                <span className="font-semibold text-emerald-600">92% Remitted</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-[#94A3B8] border-t border-slate-100 pt-3">
              <span>Ref: kp_remit_active</span>
              <span>Powered by KodiPay Engine</span>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest relative z-10 flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#007AFF]" />
          <span>Secure Administrative Suite</span>
        </div>
      </div>
    </div>
  );
}
