import { defineConfig } from 'oxlint';

export default defineConfig({
    options: {
        typeAware: true
        // this fails too much stuff, needs better function types or typescript
        //typeCheck: true
    },
    plugins: ['vue', 'vitest', 'promise', 'node', 'jsdoc', 'import', 'oxc', 'unicorn', 'typescript', 'eslint'],
    jsPlugins: [
        {
            // this is used only for eslint-js/no-restricted-syntax, replacing it would be great
            name: 'eslint-js',
            specifier: 'oxlint-plugin-eslint'
        }
    ],
    categories: {
        correctness: 'off'
    },
    ignorePatterns: ['build/**', 'Dotnet/**'],
    env: {
        // specified in overrides
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-case-declarations': 'off',
        'no-control-regex': 'warn',
        'constructor-super': 'error',
        'for-direction': 'error',
        'no-async-promise-executor': 'error',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-empty-static-block': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-global-assign': 'error',
        'no-import-assign': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-new-native-nonconstructor': 'error',
        'no-nonoctal-decimal-escape': 'error',
        'no-obj-calls': 'error',
        'no-prototype-builtins': 'error',
        'no-redeclare': 'error',
        'no-regex-spaces': 'error',
        'no-self-assign': 'error',
        'no-setter-return': 'error',
        'no-shadow-restricted-names': 'error',
        'no-sparse-arrays': 'error',
        'no-this-before-super': 'error',
        'no-unexpected-multiline': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-labels': 'error',
        'no-unused-private-class-members': 'error',
        'no-useless-backreference': 'error',
        'no-useless-catch': 'error',
        'no-useless-escape': 'error',
        'no-with': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        'vue/no-arrow-functions-in-watch': 'error',
        'vue/no-deprecated-destroyed-lifecycle': 'error',
        'vue/no-export-in-script-setup': 'error',
        'vue/no-lifecycle-after-await': 'error',
        'vue/prefer-import-from-vue': 'error',
        'vue/valid-define-emits': 'error',
        'vue/valid-define-props': 'error',
        //'vue/no-mutating-props': 'warn',
        //'vue/multi-word-component-names': 'off',
        //'vue/no-v-text-v-html-on-component': 'off',
        //'vue/no-use-v-if-with-v-for': 'warn',
        'eslint-js/no-restricted-syntax': [
            'error',
            {
                selector:
                    "AssignmentExpression[left.type='MemberExpression'][left.object.type='Identifier'][left.object.name=/Store$/]",
                message: 'Do not mutate store state directly via *Store.* assignment. Use owner-store actions.'
            },
            {
                selector:
                    "UpdateExpression[argument.type='MemberExpression'][argument.object.type='Identifier'][argument.object.name=/Store$/]",
                message: 'Do not mutate store state directly via *Store.* update operators. Use owner-store actions.'
            }
        ]
    },
    overrides: [
        {
            // front end that uses browser and vue, with custom globals
            files: ['src/**'],
            excludeFiles: ['**/__tests__/**', '**/*.spec.*', '**/*.test.*'],
            env: {
                browser: true,
                vue: true
            },
            globals: {
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
        },
        {
            // electron build, and util and build scripts that run on node
            files: [
                'src-electron/**',
                'src/localization/**',
                'src/shared/utils/localizationHelperCLI.*',
                'build-scripts/**'
            ],
            excludeFiles: ['**/__tests__/**', '**/*.spec.*', '**/*.test.*'],
            env: {
                node: true
            }
        },
        {
            // tests using vitest through node
            files: ['**/__tests__/**', '**/*.spec.*', '**/*.test.*'],
            plugins: ['vue', 'vitest', 'promise', 'node', 'jsdoc', 'import', 'oxc', 'unicorn', 'eslint'],
            env: {
                node: true,
                vitest: true,
                vue: true
            }
        }
    ]
});
