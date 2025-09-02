import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [vue()],
    define: {
        LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
        WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows')
    },
    server: {
        port: 9000
    },
    build: {
        outDir: 'build/html',
        emptyOutDir: true,
        modulePreload: { polyfill: false }
        // rollupOptions: {
        //     input: {
        // main app page
        // index: 'src/static/index.html'
        // 'app.css': 'src/app.scss'

        // css-only entries for themes
        // 'theme.dark': 'src/assets/scss/themes/theme.dark.scss',
        // 'theme.darkblue': 'src/assets/scss/themes/theme.darkblue.scss',
        // 'theme.amoled': 'src/assets/scss/themes/theme.amoled.scss',
        // 'theme.darkvanillaold':
        //     'src/assets/scss/themes/theme.darkvanillaold.scss',
        // 'theme.darkvanilla':
        //     'src/assets/scss/themes/theme.darkvanilla.scss',
        // 'theme.pink': 'src/assets/scss/themes/theme.pink.scss',
        // 'theme.material3': 'src/assets/scss/themes/theme.material3.scss'
        // }
        // output: {
        // assetFileNames: (assetInfo) => {
        //     if (assetInfo.names.some((name) => name.endsWith('.css'))) {
        //         return '[name].css';
        //     }
        //     return 'assets/[name].[ext]';
        // }
        // entryFileNames: (chunkInfo) => {
        //     console.log(chunkInfo.name);
        //     // 当chunk名是'index'时，直接返回'index.html'
        //     // 这会将其放在outDir (build/html) 的根目录下
        //     if (chunkInfo.name === 'index.html') {
        //         return 'index.html';
        //     }
        //     return 'assets/js/[name].js';
        // }
        // }
        // }
    }
}));
