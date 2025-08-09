import React from 'react';
import { motion } from 'framer-motion';

import GlassCard from '../components/GlassCard';
import { projects } from '../data/projects';

import Background from '../components/Background';

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0e0e10] antialiased text-slate-100">
      <Background />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-lg border border-white/10 rounded-full shadow-lg z-50 px-8 py-3 max-w-5xl w-full flex items-center justify-between">
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
        </header>

        <main className="grid gap-12 pt-24">
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <GlassCard>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">hi :3</h1>
                <p className="mt-4 text-slate-300">hubba bubba 🤤</p>
                <div className="mt-6 flex gap-3">
                  <a href="#projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10">temporary</a>
                  <a href="#contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10">also temporary</a>
                </div>
                {/* <div className="mt-6 text-sm text-slate-400">meow meow</div> */}
              </GlassCard>
            </motion.div>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7 }} className="w-full">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border border-white/6">
                  <img src="https://media.discordapp.net/attachments/1306727563389046805/1403579588856254556/image.png?ex=689810db&is=6896bf5b&hm=711bcc595e1be398d1e7b7df102b4104eddb86bf047ae2d12bfba922e57236e1&=&format=webp&quality=lossless" alt="scenic" className="w-full h-64 object-cover" />
                </div>
              </div>
            </motion.div>
          </section>

          <section id="projects">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">projects</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p) => (
                <motion.a key={p.id} href={p.link} whileHover={{ translateY: -6 }} className="block">
                  <GlassCard className="h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-lg">{p.title}</div>
                        <div className="mt-2 text-sm text-slate-300">{p.desc}</div>
                      </div>
                      <div className="text-sm text-slate-400">#{p.id}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-1 rounded-md border border-white/6">{t}</span>
                      ))}
                    </div>
                  </GlassCard>
                </motion.a>
              ))}
            </div>
          </section>
          <footer className="text-center text-sm text-slate-500 mt-6">© {new Date().getFullYear()} cloudy</footer>
        </main>
      </div>
    </div>
  );
}