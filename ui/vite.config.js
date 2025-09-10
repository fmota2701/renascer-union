import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base path para GitHub Pages (será o nome do repositório)
  base: process.env.NODE_ENV === 'production' ? '/sistema-distribuicao-itens/' : '/',
  
  server: {
    port: 5173,
    host: true,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar sourcemaps em produção para menor tamanho
    minify: 'terser',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['styled-components', 'lucide-react'],
          supabase: ['@supabase/supabase-js']
        },
        // Otimizar nomes de arquivos para cache
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Configurações de otimização
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log em produção
        drop_debugger: true
      }
    },
    // Aumentar limite de chunk warning
    chunkSizeWarningLimit: 1000
  },
  
  define: {
    // Definir variáveis de ambiente para o build
    'process.env': {},
    __DEV__: process.env.NODE_ENV !== 'production'
  },
  
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'styled-components',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  },
  
  // Configurações de preview para testes locais
  preview: {
    port: 4173,
    host: true
  }
})
