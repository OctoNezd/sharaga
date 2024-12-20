import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { gitDescribeSync } from 'git-describe'
import legacy from '@vitejs/plugin-legacy'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        legacy({
            targets: ['defaults', 'not IE 11', "Safari 12"],
        }),
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.startsWith('md-')
                }
            }
        }),
        VitePWA({
            mode: 'development',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            injectManifest: {
                maximumFileSizeToCacheInBytes: 3000000
            },
            manifest: {
                name: '8AM',
                short_name: '8AM',
                lang: 'ru',
                description: 'Веб-Приложение для просмотра расписания',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        __APP_VER__: JSON.stringify(gitDescribeSync(__dirname, { dirtyMark: '' }).raw),
        __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN)
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    },
    server: {
        proxy: {
            '/groups': 'http://localhost:8089',
            '/sources': 'http://localhost:8089',
            '.*\.ics': 'http://localhost:8089',
        }
    }
})
