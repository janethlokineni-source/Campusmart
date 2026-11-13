'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoginCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function LoginCard({ children, className = '' }: LoginCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier easing
      }}
      style={{
        background: 'rgba(18, 18, 18, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        boxShadow:
          '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(255, 106, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
      }}
      className={`relative z-10 w-full max-w-[460px] p-8 sm:p-10 border text-white transition-all duration-300 hover:border-[#FF6A00]/40 ${className}`}
    >
      {/* Top Glass Highlight Refraction Line */}
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent pointer-events-none" />

      {/* Internal Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

