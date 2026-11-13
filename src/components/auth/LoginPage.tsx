'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import LoginCard from './LoginCard';
import FloatingInput from './FloatingInput';
import PasswordInput from './PasswordInput';
import LoginButton from './LoginButton';
import CampusMartMark from '../common/CampusMartMark';
import {
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowLeft,
  UserPlus,
  Phone,
  Building,
  Lock,
  LogIn,
  ShieldAlert,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  allowGuestBypass?: boolean;
  initialOption?: 'customer' | 'admin';
}

export default function LoginPage({
  onSuccess,
  allowGuestBypass = false,
  initialOption = 'customer',
}: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const setUser = useAuthStore((s) => s.setUser);

  // Top-Level Two Options: 'customer' (Login or Create Acc) vs 'admin' (Admin Login)
  const [mainOption, setMainOption] = useState<'customer' | 'admin'>(initialOption);

  // Sub-tabs for Customer: 'login' vs 'register'
  const [customerSubTab, setCustomerSubTab] = useState<'login' | 'register'>('login');

  // Customer Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Customer Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHostelBlock, setRegHostelBlock] = useState('');
  const [regRoomNumber, setRegRoomNumber] = useState('');

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Customer Login Handler
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user, data.token);
        setSuccessMsg(data.message || `Welcome back, ${data.user.name}!`);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (data.user.role === 'admin') {
            router.push('/admin');
          } else {
            router.push(redirectUrl === '/login' ? '/' : redirectUrl);
          }
        }, 500);
      } else {
        setError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Customer Register Handler
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          phone: regPhone.trim(),
          hostelBlock: regHostelBlock.trim() || undefined,
          roomNumber: regRoomNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user, data.token);
        setSuccessMsg('Account registered successfully! Entering CampusMart...');

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectUrl === '/login' ? '/' : redirectUrl);
          }
        }, 500);
      } else {
        setError(data.error || 'Registration failed. Please check your inputs.');
      }
    } catch (err: any) {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your administrator password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          requireAdmin: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role !== 'admin') {
          setError('Access restricted: This account does not have administrator privileges.');
          setLoading(false);
          return;
        }

        setUser(data.user, data.token);
        setSuccessMsg(data.message || 'Administrator verified. Opening portal...');

        setTimeout(() => {
          router.push('/admin');
        }, 500);
      } else {
        setError(data.error || 'Invalid administrator credentials. Access denied.');
      }
    } catch (err: any) {
      setError('Network connection error during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#080808] text-white">
      {/* 1. Background Video Layer With Dark Fiery Overlays */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 transform motion-safe:transition-transform duration-1000 opacity-80"
          src="/videos/hero-space.mp4"
        />

        {/* Ambient Dark Charcoal Overlays */}
        <div className="absolute inset-0 bg-[#080808]/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-[#080808]/90" />
      </div>

      {/* 2. Fiery Ambient Gradient Lighting Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] bg-gradient-to-tr from-[#FF6A00]/20 to-[#FF2D16]/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-[#FF6A00]/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-[#FF2D16]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 3. Top Capsule Bar */}
      <div className="relative z-10 w-full max-w-[490px] mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 px-3.5 py-1.5 rounded-full bg-[#151515]/80 border border-white/10 backdrop-blur-md shadow-md">
          <Zap className="w-3.5 h-3.5 text-[#FF8800]" />
          <span>CampusMart Gateway</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151515]/80 border border-[#FF6A00]/30 backdrop-blur-xl text-neutral-200 text-xs font-semibold shadow-lg shadow-[#FF6A00]/10">
          <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
          <span className="text-white">Express Campus Drop</span>
        </div>
      </div>

      {/* Hero Headline & Subtitle Text */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-2.5 mb-5 px-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-white drop-shadow-2xl">
          Power Your Campus Life With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] via-[#FFA040] to-[#FF2D16]">
            Instant Delivery
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto font-normal leading-relaxed drop-shadow-md">
          Textbooks, electronics, study gear, dorm living essentials & hostel deliveries.
        </p>
      </div>

      {/* 4. Glassmorphism Auth Card */}
      <LoginCard className="max-w-[490px]">
        <div className="space-y-6">
          {/* Top Branding */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00] via-[#FF8800] to-[#FF2D16] p-[1.5px] shadow-[0_0_25px_rgba(255,106,0,0.45)]">
              <div className="w-full h-full rounded-2xl bg-[#080808]/90 backdrop-blur-md flex items-center justify-center text-white">
                {mainOption === 'admin' ? (
                  <ShieldCheck className="w-7 h-7 text-[#FF8800] drop-shadow-[0_0_10px_rgba(255,106,0,0.8)]" />
                ) : (
                  <CampusMartMark size={56} className="w-14 h-14 rounded-2xl drop-shadow-[0_0_12px_rgba(255,106,0,0.28)]" />
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-black tracking-[0.28em] text-[#FF8800] uppercase drop-shadow-[0_0_10px_rgba(255,106,0,0.3)]">
                CAMPUSMART
              </span>
              <p className="text-[10px] tracking-wider text-neutral-400 font-medium uppercase">
                {mainOption === 'admin'
                  ? 'Store Management & Control Portal'
                  : 'Fast Campus Commerce & Hostel Drop'}
              </p>
            </div>
          </div>

          {/* TWO PRIMARY OPTIONS: 1. Login / Create Acc  vs  2. Admin Login */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-neutral-400 text-center uppercase tracking-wider">
              Choose Access Option
            </div>
            <div className="p-1.5 rounded-2xl bg-[#0A0A0A]/90 border border-white/10 backdrop-blur-xl grid grid-cols-2 gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMainOption('customer');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                  mainOption === 'customer'
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-xl shadow-[#FF6A00]/30 border border-[#FFA040]/30 scale-[1.02]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Login or Create Acc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMainOption('admin');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                  mainOption === 'admin'
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF2D16] text-white shadow-xl shadow-[#FF6A00]/30 border border-[#FFA040]/30 scale-[1.02]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-300" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/40 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 shadow-lg shadow-emerald-950/40 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          {/* ================= OPTION 1: CUSTOMER (LOGIN OR CREATE ACC) ================= */}
          {mainOption === 'customer' && (
            <div className="space-y-4">
              {/* Sub-Tabs: Sign In vs Create Account */}
              <div className="flex items-center justify-center p-1 rounded-xl bg-[#141414] border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSubTab('login');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    customerSubTab === 'login'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerSubTab('register');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    customerSubTab === 'register'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Sub-Tab A: Sign In Form */}
              {customerSubTab === 'login' && (
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <FloatingInput
                    id="login-email"
                    type="email"
                    label="Email address"
                    placeholder="Enter your email (e.g. you@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                    required
                    autoComplete="email"
                  />

                  <div className="space-y-1">
                    <PasswordInput
                      id="login-password"
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setCustomerSubTab('register')}
                        className="text-xs font-semibold text-[#FFA040] hover:text-[#FF8800] transition hover:underline"
                      >
                        Don't have an account? Sign Up
                      </button>
                    </div>
                  </div>

                  <LoginButton type="submit" loading={loading}>
                    Sign In to CampusMart
                  </LoginButton>
                </form>
              )}

              {/* Sub-Tab B: Create Account Form */}
              {customerSubTab === 'register' && (
                <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Your name"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                        />
                        <User className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="10-digit mobile"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                        />
                        <Phone className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                      />
                      <Mail className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* Delivery Location (Optional) */}
                  <div className="p-2.5 rounded-xl bg-[#0D0D0D]/90 border border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-200">
                      <Building className="w-3.5 h-3.5 text-[#FF8800]" />
                      <span>Hostel Delivery Address (Optional):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={regHostelBlock}
                        onChange={(e) => setRegHostelBlock(e.target.value)}
                        placeholder="Hostel / Block"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#161616] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={regRoomNumber}
                        onChange={(e) => setRegRoomNumber(e.target.value)}
                        placeholder="Room Number"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#161616] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </div>

                  <LoginButton type="submit" loading={loading}>
                    Register & Enter Store
                  </LoginButton>
                </form>
              )}
            </div>
          )}

          {/* ================= OPTION 2: ADMIN LOGIN ================= */}
          {mainOption === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold w-full justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Authorized Campus Personnel Only</span>
              </div>

              <FloatingInput
                id="admin-email"
                type="email"
                label="Administrator Email"
                placeholder="e.g. admin@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                icon={Mail}
                required
                autoComplete="username"
              />

              <PasswordInput
                id="admin-password"
                label="Administrator Password"
                placeholder="Enter your administrator password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <LoginButton type="submit" loading={loading}>
                Authenticate & Open Admin Portal
              </LoginButton>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 tracking-wide uppercase pt-1">
                <Lock className="w-3 h-3 text-neutral-400" />
                <span>TLS 256-Bit Encrypted Admin Session</span>
              </div>
            </form>
          )}

          {/* Optional Guest Access if allowed */}
          {allowGuestBypass && (
            <div className="pt-2 border-t border-white/[0.08] text-center">
              <button
                type="button"
                onClick={onSuccess}
                className="text-[11px] text-neutral-400 hover:text-[#FFA040] transition-colors"
              >
                Or explore CampusMart catalog as Guest &rarr;
              </button>
            </div>
          )}
        </div>
      </LoginCard>
    </div>
  );
}
