import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// tauri dev가 띄우고 tauri build가 묶는 renderer
export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true },
})
