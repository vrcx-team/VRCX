import { defineConfig } from 'eslint/config';
import { jsdoc } from 'eslint-plugin-jsdoc';

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
                VERSION: 'readonly',
                NIGHTLY: 'readonly',
                webApiService: 'readonly',
                process: 'readonly',
                AppDebug: 'readonly'
            }
        }
    },
    {
        files: [
            '**/webpack.*.js',
            '**/jest.config.js',
            'src-electron/*.js',
            'src/localization/*.js',
            'src/shared/utils/localizationHelperCLI.js'
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
                ...globals.jest,
                ...globals.node,
                vi: 'readonly',
                vitest: 'readonly'
            }
        }
    },
    pluginVue.configs['flat/essential'],
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-case-declarations': 'off',
            'no-control-regex': 'warn',
            // Store boundary rule:
            // 1) Disallow `xxxStore.xxx = ...`
            // 2) Disallow `xxxStore.xxx++ / --`
            // Reason: prevent direct cross-store mutation and enforce owner-store actions.
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "AssignmentExpression[left.type='MemberExpression'][left.object.type='Identifier'][left.object.name=/Store$/]",
                    message:
                        'Do not mutate store state directly via *Store.* assignment. Use owner-store actions.'
                },
                {
                    selector:
                        "UpdateExpression[argument.type='MemberExpression'][argument.object.type='Identifier'][argument.object.name=/Store$/]",
                    message:
                        'Do not mutate store state directly via *Store.* update operators. Use owner-store actions.'
                }
            ],

            'vue/no-mutating-props': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/no-v-text-v-html-on-component': 'off',
            'vue/no-use-v-if-with-v-for': 'warn'
        }
    },
    jsdoc({
        config: 'flat/recommended',
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/reject-function-type': 'off'
        }
    })
    // {
    //     ignores: [
    //         '**/__tests__/**',
    //         '**/*.spec.{js,mjs,cjs,vue}',
    //         '**/*.test.{js,mjs,cjs,vue}'
    //     ],
    //     plugins: { 'pretty-import': prettyImport },
    //     rules: {
    //         'pretty-import/separate-type-imports': 'warn',
    //         'pretty-import/sort-import-groups': [
    //             'warn',
    //             {
    //                 groupStyleImports: true
    //             }
    //         ],
    //         'pretty-import/sort-import-names': 'warn'
    //     }
    // },
]);
