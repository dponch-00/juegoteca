/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

import { readFileSync } from 'node:fs'

// GitHub Pages sirve el sitio en /<repo>/. Cambiar aquí si el repo se llama distinto.
const REPO_BASE = '/juegoteca/'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO_BASE : '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  // public/assets/ es de Codex (arte); el JS/CSS compilado va aparte.
  build: { assetsDir: 'static' },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*', 'assets/**/*'],
      manifest: {
        name: 'Juegoteca',
        short_name: 'Juegoteca',
        description: 'Juegos de mesa para jugar en el mismo dispositivo o en línea con un código de sala.',
        lang: 'es',
        theme_color: '#1b1530',
        background_color: '#1b1530',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
  },
}))
