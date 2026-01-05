import { resolve } from 'node:path';

import fs from 'node:fs';

import { defineConfig, loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

import { languageCodes } from './localization/locales';

function getAssetLanguage(assetId) {
    if (!assetId) return null;

    if (assetId.endsWith('.json')) {
        const language = assetId.split('.json')[0];

        if (languageCodes.includes(language)) return language;
    }

    const language =
        assetId.split('element-plus/es/locale/lang/')[1]?.split('.')[0] ||
        // Font assets, e.g., noto-sans-jp-regular.woff2 mapped to language code.
        {
            jp: 'ja',
            sc: 'zh-CN',
            tc: 'zh-TW',
            kr: 'ko'
        }[assetId.split('noto-sans-')[1]?.split('-')[0]];

    return language || null;
}

function getManualChunk(moduleId) {
    const language = getAssetLanguage(moduleId);
    if (!language) return;

    return `languages/${language}`;
}

const defaultAssetName = '[hash][extname]';

function getAssetFilename({ name }) {
    const language = getAssetLanguage(name);
    if (!language) return `assets/${defaultAssetName}`;

    return `assets/languages/${language}-${defaultAssetName}`;
}

export default defineConfig(({ mode }) => {
    const { SENTRY_AUTH_TOKEN: sentryAuthToken } = loadEnv(
        mode,
        process.cwd(),
        ''
    );

    const buildAndUploadSourceMaps = !!sentryAuthToken;

    const version = fs
        .readFileSync(new URL('../Version', import.meta.url), 'utf-8')
        .trim();

    const nightly = version.split('-').at(-1).length === 7;

    return {
        base: '',
        plugins: [
            vue(),
            tailwindcss(),
            buildAndUploadSourceMaps &&
                import('@sentry/vite-plugin').then(({ sentryVitePlugin }) =>
                    sentryVitePlugin({
                        authToken: sentryAuthToken,
                        project: 'vrcx-web',
                        release: {
                            name: version
                        },
                        sourcemaps: {
                            assets: './build/html/**',
                            filesToDeleteAfterUpload: './build/html/**/*.js.map'
                        }
                    })
                )
        ],
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                minify: true,
                targets: {
                    chrome: 140
                }
            }
        },
        define: {
            LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
            WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows'),
            VERSION: JSON.stringify(version),
            NIGHTLY: JSON.stringify(nightly)
        },
        server: {
            port: 9000,
            strictPort: true
        },
        build: {
            target: 'chrome140',
            outDir: '../build/html',
            license: true,
            emptyOutDir: true,
            copyPublicDir: true,
            reportCompressedSize: false,
            chunkSizeWarningLimit: 5000,
            sourcemap: buildAndUploadSourceMaps,
            assetsInlineLimit: 0,
            rollupOptions: {
                preserveEntrySignatures: false,
                input: {
                    index: resolve(import.meta.dirname, './index.html'),
                    vr: resolve(import.meta.dirname, './vr.html')
                },
                output: {
                    assetFileNames: getAssetFilename,
                    manualChunks: getManualChunk
                }
            }
        }
    };
});
