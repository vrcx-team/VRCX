import { defineConfig } from 'oxfmt';

export default defineConfig({
    // These come from .editorconfig, override in file:///./.editorconfig
    // See https://oxc.rs/docs/guide/usage/formatter/config.html#editorconfig
    //
    //endOfLine: 'crlf',
    //useTabs: false,
    //tabWidth: 4,
    //printWidth: 120,
    //insertFinalNewline: true,
    //
    semi: true,
    singleQuote: true,
    trailingComma: 'none',
    bracketSpacing: true,
    arrowParens: 'always',
    jsdoc: {
        lineWrappingStyle: 'balance',
        commentLineStrategy: 'keep'
    },
    ignorePatterns: ['build/**'],
    overrides: [
        {
            files: ['*.vue'],
            options: {
                bracketSameLine: true,
                vueIndentScriptAndStyle: true
            }
        }
    ]
});
