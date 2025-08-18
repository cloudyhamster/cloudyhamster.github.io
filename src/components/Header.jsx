import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-5xl w-full">
      <div className="liquid-glass-header flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-semibold text-xl">CH</div>
          <div className="flex flex-col flex-grow">
            <div className="text-lg font-semibold text-white truncate">cloudyhamster</div>
            <div className="text-sm text-white/70 truncate">best guy around</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#projects" className="hover:text-white transition">projects</a>
          <a href="#about" className="hover:text-white transition">about</a>
          <a href="#contact" className="hover:text-white transition">contact</a>
          <a href="#" className="ml-4 px-3 py-2 bg-white/20 rounded-full border border-white/30 hover:bg-white/30 transition">special button</a>
        </nav>
      </div>
    </header>
  );
}
