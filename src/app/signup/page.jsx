'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  Phone,
  ShieldCheck,
  RefreshCcw,
  User,
} from 'lucide-react';
import { completeSignup, sendVerification, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Identifier, 1.5: OTP, 2: Profile Info, 3: Success
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [error, setError] = useState('');
  const [authType, setAuthType] = useState('email'); // 'email' or 'phone'
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    fullName: '',
    agencyName: ''
  });

  // OTP State (4 digits)
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const identifierRef = useRef(null);
  const agencyRef = useRef(null);
  const nameRef = useRef(null);
  const secondaryRef = useRef(null);

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
      handleNext();
    }
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      const identifier = authType === 'email' ? formData.email : formData.phone;
      if (authType === 'email' && !identifier.includes('@')) return setError('Email address must contain an "@" symbol (e.g. name@agency.com)');
      if (authType === 'phone' && identifier.length < 10) return setError('Phone number must be at least 10 digits starting with 07 or 01');
      
      setLoading(true);
      try {
        await sendVerification(authType === 'email' ? identifier : null, authType === 'phone' ? identifier : null);
        setStep(1.5);
      } catch (err) {
        setError('Failed to send code. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (step === 1.5) {
      const otpString = otp.join('');
      if (otpString.length < 4) return setError('Please enter the full 4-digit security code sent to your device');
      setLoading(true);
      try {
        const res = await verifyOtp(
            authType === 'email' ? formData.email : null, 
            authType === 'phone' ? formData.phone : null, 
            otpString
        );
        if (res.success) {
          if (!res.data.newUser) {
            login(res.data.token, res.data.user);
            router.push('/dashboard');
          } else {
            setStep(2);
          }
        } else {
          setError(res.error || 'Invalid code');
        }
      } catch (err) {
        setError('Verification failed');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!formData.agencyName) return setError('Please enter the full name of your property agency');
      if (!formData.fullName) return setError('Please provide your full legal name');
      
      // Validate secondary identifier
      if (authType === 'email' && !formData.phone) return setError('Please provide a 10-digit phone number for account recovery');
      if (authType === 'phone' && !formData.email) return setError('Please provide an email address for account recovery');
      if (authType === 'phone' && !formData.email.includes('@')) return setError('Email address must contain an "@" symbol');

      handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 1.5) setStep(1);
    else if (step === 2) setStep(1.5);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendVerification(authType === 'email' ? formData.email : null, authType === 'phone' ? formData.phone : null);
      setResendStatus('Sent!');
      setOtp(['', '', '', '']);
      setTimeout(() => setResendStatus(''), 3000);
    } catch (err) {
      setError('Failed to resend');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await completeSignup({
        email: formData.email,
        phone: formData.phone,
        agencyName: formData.agencyName,
        fullName: formData.fullName
      });
      if (response.success) {
        login(response.data.token, response.data.user);
        setStep(3);
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 1) identifierRef.current?.focus();
    else if (step === 1.5) otpRefs[0].current?.focus();
    else if (step === 2) agencyRef.current?.focus();
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
          {step > 1 && step < 3 && (
            <button
              onClick={handleBack}
              className="text-[9px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 uppercase tracking-widest"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => router.push('/signin')}
              className="text-[9px] font-bold text-[#007AFF] hover:text-[#005FB8] uppercase tracking-widest"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Top desktop button */}
        <div className="hidden md:flex justify-between items-center">
          {step > 1 && step < 3 ? (
            <button
              onClick={handleBack}
              className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}
          {step === 1 && (
            <button
              onClick={() => router.push('/signin')}
              className="text-[10px] font-bold text-[#007AFF] hover:text-[#005FB8] uppercase tracking-widest transition-colors"
            >
              Already have an account? Sign In
            </button>
          )}
        </div>

        {/* Form area */}
        <div className="my-auto max-w-[360px] w-full mx-auto space-y-8">
          {error && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-3xl font-semibold text-[#0F172A] tracking-[-0.03em]">Create Account</h2>
                <p className="text-[10px] font-bold text-[#64748B] mt-2 uppercase tracking-widest">Start your property management journey</p>
              </div>

              <div className="flex bg-[#F1F5F9] p-1 rounded-md">
                <button onClick={() => setAuthType('email')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${authType === 'email' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]'}`}>Email</button>
                <button onClick={() => setAuthType('phone')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${authType === 'phone' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B]'}`}>Phone</button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
                  {authType === 'email' ? 'Work Email Address' : 'Mobile Phone Number'}
                </label>
                <div className="relative group">
                  {authType === 'email' ? <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF] transition-colors" /> : <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF] transition-colors" />}
                  <input
                    ref={identifierRef}
                    name={authType === 'email' ? 'email' : 'phone'}
                    type={authType === 'email' ? 'email' : 'tel'}
                    placeholder={authType === 'email' ? 'name@agency.com' : '0712 345 678'}
                    value={authType === 'email' ? formData.email : formData.phone}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[14px] font-medium text-[#0F172A] placeholder:text-[#94A3B8]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1.5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-3xl font-semibold text-[#0F172A] tracking-[-0.03em]">Verify Identity</h2>
                <p className="text-[10px] font-bold text-[#64748B] mt-2 uppercase tracking-widest leading-relaxed">
                  Enter the code sent to your {authType}
                </p>
              </div>

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

              <div className="text-center">
                <button onClick={handleResend} className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center justify-center gap-2 uppercase tracking-widest transition-colors">
                  {resending ? 'Sending...' : 'Resend Verification Code'} {resendStatus ? <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF] ml-1" /> : <RefreshCcw className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-3xl font-semibold text-[#0F172A] tracking-[-0.03em]">Complete Profile</h2>
                <p className="text-[10px] font-bold text-[#64748B] mt-2 uppercase tracking-widest">Provide your administrative details</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Agency Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF]" />
                    <input
                      ref={agencyRef}
                      name="agencyName"
                      placeholder="e.g. Skyline Properties"
                      value={formData.agencyName}
                      onChange={handleChange}
                      className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Administrator Name</label>
                  <div className="relative group">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF]" />
                    <input
                      ref={nameRef}
                      name="fullName"
                      placeholder="Your Full Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
                    Recovery {authType === 'email' ? 'Phone' : 'Email'}
                  </label>
                  <div className="relative group">
                    {authType === 'email' ? <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF]" /> : <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#007AFF]" />}
                    <input
                      ref={secondaryRef}
                      name={authType === 'email' ? 'phone' : 'email'}
                      type={authType === 'email' ? 'tel' : 'email'}
                      placeholder={authType === 'email' ? '07XX XXX XXX' : 'name@example.com'}
                      value={authType === 'email' ? formData.phone : formData.email}
                      onChange={handleChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="w-full pl-7 py-3 bg-transparent border-b border-[#E2E8F0] focus:border-[#007AFF] outline-none transition-all text-[13px] font-medium text-[#0F172A]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center py-6 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
              </div>
              <h2 className="text-3xl font-semibold text-[#0F172A] tracking-[-0.03em]">Registration Complete</h2>
              <p className="text-[10px] font-bold text-[#64748B] mt-2 uppercase tracking-widest leading-relaxed">Initializing your management dashboard</p>
              <div className="mt-8 w-12 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] animate-progress-fast" />
              </div>
            </div>
          )}
        </div>

        {/* Floating Navigation / Footer */}
        {step < 3 ? (
          <div className="pt-8 border-t border-[#F1F5F9] flex items-center justify-between">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                  i === Math.ceil(step) ? 'w-8 bg-[#0F172A]' : 'w-3 bg-[#E2E8F0]'
                }`} />
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={loading}
              className="h-12 px-6 rounded-md bg-[#0F172A] text-white flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-slate-200/50 disabled:bg-[#CBD5E1] disabled:shadow-none"
            >
              <span className="text-[13px] font-semibold">Continue</span>
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="text-center pt-8 border-t border-[#F1F5F9]">
            <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">
              KodiPay Administrative Suite
            </p>
          </div>
        )}
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
