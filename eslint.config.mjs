import { defineConfig } from 'eslint/config';

import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettyImport from '@kamiya4047/eslint-plugin-pretty-import';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,vue}'],
        plugins: { js },
        extends: ['js/recommended']
    },
    {
        files: ['**/*.{js,mjs,cjs,vue}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                CefSharp: 'readonly',
                VRCX: 'readonly',
                VRCXStorage: 'readonly',
                SQLite: 'readonly',
                LogWatcher: 'readonly',
                Discord: 'readonly',
                AppApi: 'readonly',
                AppApiVr: 'readonly',
                WebApi: 'readonly',
                AssetBundleManager: 'readonly',
                WINDOWS: 'readonly',
                LINUX: 'readonly',
                webApiService: 'readonly',
                process: 'readonly'
            }
        }
    },
    {
        files: [
            '**/webpack.*.js',
            '**/jest.config.js',
            'src-electron/*.js',
            'src/localization/*.js'
        ],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        }
    },
    {
        files: [
            '**/__tests__/**/*.{js,mjs,cjs,vue}',
            '**/*.spec.{js,mjs,cjs,vue}',
            '**/*.test.{js,mjs,cjs,vue}'
        ],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    },
    pluginVue.configs['flat/essential'],
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-case-declarations': 'off',
            'no-control-regex': 'warn',

            'vue/no-mutating-props': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/no-v-text-v-html-on-component': 'off',
            'vue/no-use-v-if-with-v-for': 'warn'
        }
    },
    {
        plugins: { 'pretty-import': prettyImport },
        rules: {
            'pretty-import/separate-type-imports': 'warn',
            'pretty-import/sort-import-groups': [
                'warn',
                {
                    groupStyleImports: true
                }
            ],
            'pretty-import/sort-import-names': 'warn'
        }
    },
    eslintPluginPrettierRecommended
]);
