import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/cloudyhamster.github.io/', 
  plugins: [react()],
})