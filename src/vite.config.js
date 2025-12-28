import { resolve } from 'node:path';

import fs from 'node:fs';

import { defineConfig, loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

/**
 * @param {string | undefined} assetId
 */
function getAssetLanguage(assetId) {
    if (!assetId) return null;

    const language =
        assetId.split('localization/')[1]?.split('.')[0]?.toLowerCase() ||
        assetId.split('element-plus/es/locale/lang/')[1]?.split('.')[0] ||
        // Font assets, e.g., noto-sans-jp-regular.woff2 mapped to language code.
        {
            jp: 'ja',
            sc: 'zh-cn',
            tc: 'zh-tw',
            kr: 'ko'
        }[assetId.split('noto-sans-')[1]?.split('-')[0]];

    if (language === 'index') return null;
    return language || null;
}

export default defineConfig(({ mode }) => {
    const { DEBUG: debug, SENTRY_AUTH_TOKEN: sentryAuthToken } = loadEnv(
        mode,
        process.cwd(),
        ''
    );

    const buildAndUploadSourceMaps = !!debug || !!sentryAuthToken;

    const version = fs
        .readFileSync(new URL('../Version', import.meta.url), 'utf-8')
        .trim();

    const nightly = version.split('-').at(-1).length === 7;

    return {
        base: '',
        plugins: [
            // Bundle analysis tool, run `DEBUG=1 npm run prod` to enable.
            debug && import('sonda/vite').then(({ default: sonda }) => sonda()),
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
                            filesToDeleteAfterUpload: !debug
                                ? './build/html/**/*.js.map'
                                : undefined
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
            cssMinify: 'lightningcss',
            license: true,
            emptyOutDir: true,
            copyPublicDir: false,
            // reportCompressedSize: false,
            // chunkSizeWarningLimit: 5000,
            sourcemap: buildAndUploadSourceMaps,
            assetsInlineLimit: 0,
            rollupOptions: {
                preserveEntrySignatures: false,
                input: {
                    index: resolve(import.meta.dirname, './index.html'),
                    vr: resolve(import.meta.dirname, './vr.html')
                },                
                output: {
                    exports: "none",
                    assetFileNames: ({ name }) => {
                        const language = getAssetLanguage(name);
                        if (!language) return 'assets/[name]-[hash][extname]';

                        return `assets/languages/${language}/[name]-[hash][extname]`;
                    },
                    manualChunks: (moduleId) => {
                        const language = getAssetLanguage(moduleId);
                        if (!language) return null;

                        return `languages/${language}/messages`;
                    }
                }
            }
        }
    };
});
