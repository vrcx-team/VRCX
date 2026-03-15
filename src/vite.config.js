import { resolve } from 'node:path';

import fs from 'node:fs';

import { defineConfig, loadEnv } from 'vite';
import { browserslistToTargets } from 'lightningcss';

import browserslist from 'browserslist';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

import { languageCodes } from './localization/locales';

/**
 *
 * @param assetId
 */
function getAssetLanguage(assetId) {
    if (!assetId) return null;

    if (assetId.endsWith('.json')) {
        const language = assetId.split('.json')[0];

        if (languageCodes.includes(language)) return language;
    }

    const language =
        // Font assets, e.g., noto-sans-jp-regular.woff2 mapped to language code.
        {
            jp: 'ja',
            sc: 'zh-CN',
            tc: 'zh-TW',
            kr: 'ko'
        }[assetId.split('noto-sans-')[1]?.split('-')[0]];

    return language || null;
}

/**
 *
 * @param moduleId
 */
function getManualChunk(moduleId) {
    const language = getAssetLanguage(moduleId);
    if (!language) return;

    return `i18n/${language}`;
}

const defaultAssetName = '[hash][extname]';

/**
 * @param {string} name
 */
function isFont(name) {
    return /\.(woff2?|ttf|otf|eot)$/.test(name);
}

/**
 *
 * @param {import('rolldown').PreRenderedAsset} assetInfo
 */
function getAssetFilename({ name }) {
    const language = getAssetLanguage(name);
    if (!language) return `assets/${defaultAssetName}`;

    if (isFont(name)) return 'assets/fonts/[name][extname]';
    return 'assets/i18n/[name][extname]';
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

    const nightly =
        mode === 'development' || version.split('-').at(-1).length === 7;

    return {
        base: '',
        plugins: [
            vue(),
            vueJsx({
                tsTransform: 'built-in'
            }),
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
        resolve: {
            alias: {
                '@': resolve(import.meta.dirname, '.')
            }
        },
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                drafts: {
                    customMedia: true
                },
                errorRecovery: true,
                targets: browserslistToTargets(browserslist('Chrome 144'))
            }
        },
        optimizeDeps: {
            include: [
                'vue',
                'vue/jsx-runtime',
                'reka-ui',
                'pinia',
                'vue-i18n',
                'tailwindcss',
                'lucide-vue-next',
                '@vueuse/core',
                'vue-sonner',
                'dayjs'
            ]
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
            target: 'chrome144',
            cssTarget: 'chrome144',
            outDir: '../build/html',
            license: true,
            emptyOutDir: true,
            copyPublicDir: true,
            reportCompressedSize: false,
            chunkSizeWarningLimit: 5000,
            sourcemap: buildAndUploadSourceMaps,
            assetsInlineLimit: 40960,
            rolldownOptions: {
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
