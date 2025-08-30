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
        rollupOptions: {
            input: {
                // main app page
                index: 'src/static/index.html',
                // css-only entries for themes
                'theme.dark': 'src/assets/scss/themes/theme.dark.scss',
                'theme.darkblue': 'src/assets/scss/themes/theme.darkblue.scss',
                'theme.amoled': 'src/assets/scss/themes/theme.amoled.scss',
                'theme.darkvanillaold':
                    'src/assets/scss/themes/theme.darkvanillaold.scss',
                'theme.darkvanilla':
                    'src/assets/scss/themes/theme.darkvanilla.scss',
                'theme.pink': 'src/assets/scss/themes/theme.pink.scss',
                'theme.material3': 'src/assets/scss/themes/theme.material3.scss'
            }
        }
    }
}));
