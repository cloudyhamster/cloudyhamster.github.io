import React from 'react';
import { motion } from 'framer-motion';

import GlassCard from '../components/GlassCard';
import { projects } from '../data/projects';

import Background from '../components/Background';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0e0e10] antialiased text-slate-100">
      <Background />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <Header />

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
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
          <footer className="text-center text-sm text-slate-500 mt-6">© {new Date().getFullYear()} cloudy</footer>
        </main>
      </div>
    </div>
  );
}