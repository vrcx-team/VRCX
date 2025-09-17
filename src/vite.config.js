import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.SENTRY_URL;
const authToken = process.env.SENTRY_AUTH_TOKEN;

// https://vite.dev/config/
export default defineConfig(() => ({
    base: '',
    plugins: [
        vue(),
        url &&
            sentryVitePlugin({
                url,
                authToken,
                org: 'vrcx',
                project: 'vrcx-web'
            })
    ],
    define: {
        LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
        WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows')
    },
    server: {
        port: 9000
    },
    build: {
        target: 'esnext',
        outDir: '../build/html',
        emptyOutDir: true,
        copyPublicDir: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 5000,
        modulePreload: { polyfill: false },
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                vr: resolve(__dirname, 'vr.html')
            }
        },
        sourcemap: true
    }
}));
