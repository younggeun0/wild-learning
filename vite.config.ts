import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// tauri dev·build와 웹앱 배포가 같은 dist를 쓴다
export default defineConfig({
  root: 'src/renderer',
  publicDir: '../../public',
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true },
})
