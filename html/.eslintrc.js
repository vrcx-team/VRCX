module.exports = {
    root: true,
    env: {
        browser: true,
        commonjs: true,
        es2020: true
    },
    parserOptions: {
        sourceType: 'module'
    },
    globals: {
        CefSharp: 'readonly',
        VRCX: 'readonly',
        VRCXStorage: 'readonly',
        SQLite: 'readonly',
        LogWatcher: 'readonly',
        Discord: 'readonly',
        AppApi: 'readonly',
        SharedVariable: 'readonly',
        WebApi: 'readonly'
    },
    extends: 'eslint:all',
    rules: {
        'array-bracket-newline': 0,
        'array-element-newline': 0,
        'block-scoped-var': 0,
        camelcase: 0,
        'capitalized-comments': 0,
        complexity: 0,
        'func-names': 0,
        'function-call-argument-newline': 0,
        'guard-for-in': 0,
        'id-length': 0,
        indent: 0,
        'linebreak-style': 0,
        'lines-around-comment': 0,
        'max-depth': 0,
        'max-len': 0,
        'max-lines': 0,
        'max-lines-per-function': 0,
        'max-statements': 0,
        'multiline-comment-style': 0,
        'newline-per-chained-call': 0,
        'new-cap': 0,
        'no-await-in-loop': 0,
        'no-bitwise': 0,
        'no-console': 0,
        'no-continue': 0,
        'no-control-regex': 0,
        'no-empty': [
            'error',
            {
                allowEmptyCatch: true
            }
        ],
        'no-extra-parens': 0,
        'no-invalid-this': 0,
        'no-magic-numbers': 0,
        'no-mixed-operators': 0,
        'no-negated-condition': 0,
        'no-param-reassign': 0,
        'no-plusplus': 0,
        'no-redeclare': 0,
        'no-shadow': 0,
        'no-tabs': 0,
        'no-ternary': 0,
        'no-underscore-dangle': 0,
        'no-var': 0,
        'no-warning-comments': 0,
        'object-curly-spacing': [
            'error',
            'always'
        ],
        'object-property-newline': 0,
        'one-var': 0,
        'padded-blocks': 0,
        'prefer-arrow-callback': 0,
        'prefer-destructuring': 0,
        'prefer-named-capture-group': 0,
        quotes: [
            'error',
            'single',
            {
                avoidEscape: true
            }
        ],
        'quote-props': 0,
        'require-unicode-regexp': 0,
        'sort-imports': 0,
        'sort-keys': 0,
        'sort-vars': 0,
        'space-before-function-paren': [
            'error',
            {
                named: 'never'
            }
        ],
        strict: 0,
        'vars-on-top': 0,
        'wrap-regex': 0
    }
};
