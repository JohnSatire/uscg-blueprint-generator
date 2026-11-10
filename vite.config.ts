import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://johnsatire.github.io/uscg-blueprint-generator/
  base: process.env.VITE_BASE ?? '/uscg-blueprint-generator/',
})
