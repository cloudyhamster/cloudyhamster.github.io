import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

export default function ProjectCard({ project }) {
  return (
    <motion.a
      key={project.id}
      href={project.link}
      whileHover={{ translateY: -6 }}
      className="block"
    >
      <GlassCard className="h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-lg">{project.title}</div>
            <div className="mt-2 text-sm text-slate-300">{project.desc}</div>
          </div>
          <div className="text-sm text-slate-400">#{project.id}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded-md border border-white/6">
              {t}
            </span>
          ))}
        </div>
      </GlassCard>
    </motion.a>
  );
}
