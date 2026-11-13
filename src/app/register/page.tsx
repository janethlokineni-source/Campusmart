'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import CampusMartMark from '@/components/common/CampusMartMark';
import {
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Zap,
  ArrowLeft,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          hostelBlock: hostelBlock.trim() || undefined,
          roomNumber: roomNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user, data.token);
        router.push('/account');
      } else {
        setError(data.error || 'Registration failed. Please check inputs.');
      }
    } catch (err: any) {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#080808] text-white">
      {/* 1. Background Video Layer With Dark Fiery Overlays (matches homepage hero) */}
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

      {/* 3. Top Navigation & Capsule Bar */}
      <div className="relative z-10 w-full max-w-xl mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition px-3.5 py-1.5 rounded-full bg-[#151515]/80 border border-white/10 backdrop-blur-md hover:border-[#FF6A00]/40 shadow-md group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#FF8800] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Store</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151515]/80 border border-[#FF6A00]/30 backdrop-blur-xl text-neutral-200 text-xs font-semibold shadow-lg shadow-[#FF6A00]/10">
          <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping" />
          <Zap className="w-3.5 h-3.5 text-[#FF8800]" />
          <span>CampusMart Express</span>
        </div>
      </div>

      {/* 4. Main Glass Card */}
      <div
        style={{
          background: 'rgba(18, 18, 18, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '28px',
          boxShadow:
            '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(255, 106, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        }}
        className="relative z-10 w-full max-w-xl p-6 sm:p-9 border text-white transition-all duration-300 hover:border-[#FF6A00]/40 space-y-6"
      >
        {/* Top Glass Highlight Refraction Line */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151515] border border-[#FF6A00]/30 text-[#FFA040] text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF8800]" />
            <span>Fast & Secure Student Registration</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <CampusMartMark size={48} className="w-12 h-12 shrink-0 rounded-2xl drop-shadow-lg" />
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Create Account
              </h1>
              <p className="text-[11px] text-neutral-400 font-medium">Register with your Gmail for campus orders & express delivery</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/25 transition"
                />
                <User className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/25 transition"
                />
                <Phone className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Gmail Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/25 transition"
              />
              <Mail className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Create Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-white/10 bg-[#141414]/90 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/25 transition"
              />
              <Lock className="w-3.5 h-3.5 text-[#FF8800] absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-[#FFA040] transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campus Delivery Address (Optional) */}
          <div className="p-3.5 rounded-2xl bg-[#0D0D0D]/90 border border-white/10 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
              <Building className="w-3.5 h-3.5 text-[#FF8800]" />
              <span>Campus Delivery Address (Optional):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Hostel / Residence Block
                </label>
                <input
                  type="text"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  placeholder="e.g. Hostel Block / Wing"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#161616] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Room / Flat Number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room Number"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#161616] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6A00] via-[#FF8800] to-[#FF2D16] hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#FF6A00]/30 transition flex items-center justify-center gap-2 group"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400">
          <span>Already registered?</span>
          <Link
            href="/login"
            className="text-[#FFA040] hover:text-[#FF8800] font-bold hover:underline flex items-center gap-1 transition"
          >
            <span>Sign In to CampusMart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
