import React from 'react';
import { Link } from 'react-router-dom';
import Background from '../components/Background';
import GlassCard from '../components/GlassCard';

export default function NotFoundPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0e0e10] antialiased text-slate-100 flex items-center justify-center text-center">
      <Background />
      <div className="relative z-10">
        <GlassCard>
          <h1 className="text-8xl font-extrabold text-white">404</h1>
          <p className="mt-4 text-lg text-slate-300">
            the page you're looking for could not be found (it probably doesn't exist :3)
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              return to homepage
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
