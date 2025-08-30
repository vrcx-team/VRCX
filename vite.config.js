import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
        WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows')
    },
    server: {
        port: 9000
    }
});
