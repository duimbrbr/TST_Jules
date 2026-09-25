import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mercadolista-icon.svg', 'apple-touch-icon.svg', 'masked-icon.svg'],
      manifest: {
        name: 'MercadoLista - Lista de Compras Inteligente',
        short_name: 'MercadoLista',
        description: 'App de Lista de Mercado com Leitor de Código de Barras, NFC-e e Comparação de Preços',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'mercadolista-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'mercadolista-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});
