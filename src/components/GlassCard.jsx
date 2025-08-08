import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-lg p-6 ${className}`}
      style={{
        boxShadow: '0 10px 30px rgba(12,15,20,0.35)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
      }}
    >
      {children}
    </div>
  );
}