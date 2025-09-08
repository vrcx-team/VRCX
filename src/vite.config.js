import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(() => ({
    base: '',
    plugins: [vue()],
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
        modulePreload: { polyfill: false },
        rollupOptions: {
            input: {
                // main app page
                index: resolve(__dirname, 'index.html'),
                vr: resolve(__dirname, 'vr.html'),

                // css-only entries for themes
                'theme.dark': resolve(
                    __dirname,
                    'assets/scss/themes/theme.dark.scss'
                ),
                'theme.darkblue': resolve(
                    __dirname,
                    'assets/scss/themes/theme.darkblue.scss'
                ),
                'theme.amoled': resolve(
                    __dirname,
                    'assets/scss/themes/theme.amoled.scss'
                ),
                'theme.darkvanillaold': resolve(
                    __dirname,
                    'assets/scss/themes/theme.darkvanillaold.scss'
                ),
                'theme.darkvanilla': resolve(
                    __dirname,
                    'assets/scss/themes/theme.darkvanilla.scss'
                ),
                'theme.pink': resolve(
                    __dirname,
                    'assets/scss/themes/theme.pink.scss'
                ),
                'theme.material3': resolve(
                    __dirname,
                    'assets/scss/themes/theme.material3.scss'
                )
            },
            output: {
                assetFileNames: (assetInfo) => {
                    if (
                        assetInfo.originalFileNames.find((name) =>
                            name.endsWith('.scss')
                        )
                    ) {
                        return `assets/${assetInfo.originalFileName.replace(/.*[/\\]|\.scss/g, '')}[extname]`;
                    }
                    return 'assets/[name][extname]';
                }
            }
        }
    }
}));
