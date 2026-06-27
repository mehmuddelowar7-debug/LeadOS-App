import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      useCredentials: true,
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'LeadOS CRM',
        short_name: 'LeadOS',
        description: 'AI Powered Mobile Field CRM',
        theme_color: '#16171d',
        background_color: '#16171d',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['productivity', 'business', 'finance'],
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Contact',
            short_name: 'Contact',
            description: 'Capture a new lead',
            url: '/contacts/new?mode=quick',
            icons: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: 'View Dashboard',
            short_name: 'Dashboard',
            description: 'View your daily metrics',
            url: '/',
            icons: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('framer-motion')) return 'vendor-framer'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts'
          if (id.includes('@sentry')) return 'vendor-sentry'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('react-dom') || (id.includes('node_modules/react/') )) return 'vendor-react'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-hook-form') || id.includes('/zod/')) return 'vendor-forms'
          if (id.includes('@tanstack')) return 'vendor-query'
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  }
})
