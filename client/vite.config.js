import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'logo.png', 'logo_circular.png', 'logo_v2.png', 'Roboto-Regular.ttf'],
            manifest: {
                name: 'Arab Contractors Cameroon',
                short_name: 'ACC',
                description: 'Construction site management app for Arab Contractors in Cameroon',
                start_url: '/',
                display: 'standalone',
                background_color: '#1a1a2e',
                theme_color: '#1a1a2e',
                icons: [
                    {
                        src: 'favicon.png',
                        sizes: '64x64',
                        type: 'image/png'
                    },
                    {
                        src: 'logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'logo_circular.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                // Precache all built assets
                globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,woff,woff2}'],
                // Runtime caching strategies
                runtimeCaching: [
                    {
                        // API GET requests — NetworkFirst with cache fallback
                        urlPattern: ({ request, url }) => {
                            return url.pathname.startsWith('/api') && request.method === 'GET';
                        },
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 30,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // Static assets from CDN or external — CacheFirst
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|ttf|woff|woff2)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    }
                ],
                // Don't cache API mutations
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api\//]
            }
        })
    ],
    server: {
        host: true, // Enable network access
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    three: ['three', '@react-three/fiber', '@react-three/drei'],
                    utils: ['axios', 'jspdf', 'jspdf-autotable']
                }
            }
        }
    }
})
