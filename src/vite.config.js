import { resolve } from 'node:path';

import fs from 'node:fs';

import { defineConfig, loadEnv } from 'vite';
import { browserslistToTargets } from 'lightningcss';

import browserslist from 'browserslist';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

import { languageCodes } from './localization/locales';

/** what platform we are on */
const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';

/* what platform we are building for */
const buildLinux =
    process.env.PLATFORM != undefined
        ? process.env.PLATFORM === 'linux'
        : isLinux;
const buildWindows =
    process.env.PLATFORM != undefined
        ? process.env.PLATFORM === 'windows'
        : isWindows;

/**
 * Vite plugin to remove legacy remixicon font files (eot, woff, ttf, svg)
 * from the build output, keeping only woff2. Saves ~4.5 MB.
 *
 * Chrome 144 picks woff2 from the multi-format @font-face src list and
 * never requests the other formats, so deleting them is safe.
 *
 * @returns {import('vite').Plugin}
 */
function remixiconWoff2Only() {
    return {
        name: 'remixicon-woff2-only',
        generateBundle(_, bundle) {
            for (const key of Object.keys(bundle)) {
                if (/remixicon\.(eot|ttf|svg|woff)$/.test(key)) {
                    delete bundle[key];
                }
            }
        }
    };
}

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
    const basename = moduleId.split('/').pop();
    const language = getAssetLanguage(basename);
    if (!language) return;

    return `i18n/${language}`;
}

const defaultAssetName = '[name][extname]';

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

/**
 * @param ConfigEnv configEnv
 * @returns {import('vite').UserConfig}
 */
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

    /** @type {import('vite').UserConfig} */
    return {
        base: '',
        plugins: [
            remixiconWoff2Only(),
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
                            filesToDeleteAfterUpload:
                                './build/html/**/*.js.map',
                            ignore: []
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
                targets: browserslistToTargets(browserslist('Chrome 145'))
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
            LINUX: JSON.stringify(buildLinux),
            WINDOWS: JSON.stringify(buildWindows),
            VERSION: JSON.stringify(version),
            NIGHTLY: JSON.stringify(nightly)
        },
        server: {
            port: 9000,
            strictPort: true
        },
        build: {
            target: 'chrome145',
            outDir: '../build/html',
            license: true,
            emptyOutDir: true,
            copyPublicDir: true,
            reportCompressedSize: false,
            chunkSizeWarningLimit: 5000,
            sourcemap: buildAndUploadSourceMaps ? 'hidden' : false,
            assetsInlineLimit(filePath, content) {
                if (isFont(filePath)) return false;
                if (filePath.endsWith('.json')) return false;
                return content.length <= 40960;
            },
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
