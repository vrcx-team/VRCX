import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import fs from 'node:fs';

import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

import vue from '@vitejs/plugin-vue';

const __dirname = dirname(fileURLToPath(import.meta.url));

const authToken = process.env.SENTRY_AUTH_TOKEN;
const buildAndUploadSourceMaps = authToken ? true : false;
const vrcxVersion = fs
    .readFileSync(resolve(__dirname, '../Version'), 'utf-8')
    .trim();
if (buildAndUploadSourceMaps) {
    console.log('Source maps will be built and uploaded to Sentry');
}

// https://vite.dev/config/
export default defineConfig(() => ({
    base: '',
    plugins: [
        vue(),
        buildAndUploadSourceMaps &&
            sentryVitePlugin({
                authToken,
                project: 'vrcx-web',
                release: {
                    name: vrcxVersion
                },
                sourcemaps: {
                    assets: './build/html/**',
                    filesToDeleteAfterUpload: './build/html/**/*.js.map'
                }
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
        sourcemap: buildAndUploadSourceMaps
    }
}));
