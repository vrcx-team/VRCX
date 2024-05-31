const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        vendor: [
            'element-ui',
            'noty',
            'vue',
            'vue-data-tables',
            'vue-lazyload'
        ],
        app: {
            import: ['./src/app.js', './src/app.scss'],
            dependOn: 'vendor'
        },
        'theme.dark': './src/theme.dark.scss',
        'theme.darkvanilla': './src/theme.darkvanilla.scss',
        'theme.pink': './src/theme.pink.scss',
        'theme.material3': './src/theme.material3.scss',
        flags: './src/flags.scss',
        'animated-emoji': './src/animated-emoji.scss',
        vr: {
            import: ['./src/vr.js', './src/vr.scss'],
            dependOn: 'vendor'
        }
    },
    output: {
        filename: '[name].js',
        library: {
            type: 'window'
        }
    },
    module: {
        rules: [
            {
                test: /\.pug$/,
                oneOf: [
                    {
                        resourceQuery: /^\?vue/,
                        use: 'pug-plain-loader'
                    },
                    {
                        use: ['raw-loader', 'pug-plain-loader']
                    }
                ]
            },
            {
                test: /\.s?css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
            },
            {
                test: /\.(eot|png|svg|ttf|woff)/,
                type: 'asset',
                generator: {
                    filename: 'assets/[name][ext]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.css', '.js', '.scss'],
        alias: {
            vue: path.join(
                __dirname,
                './node_modules/vue/dist/vue.common.prod.js'
            )
        }
    },
    performance: {
        hints: false
    },
    devtool: 'inline-source-map',
    target: ['web', 'es2020'],
    stats: {
        preset: 'errors-only',
        builtAt: true,
        timings: true
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.pug',
            inject: false,
            minify: false
        }),
        new HtmlWebpackPlugin({
            filename: 'vr.html',
            template: './src/vr.pug',
            inject: false,
            minify: false
        }),
        new CopyPlugin({
            patterns: [
                // assets
                {
                    from: './images/',
                    to: './images/'
                }
                // // vscode-codicons
                // {
                //     from: './node_modules/vscode-codicons/dist/codicon.css',
                //     to: 'vendor/vscode-codicons/'
                // },
                // {
                //     from: './node_modules/vscode-codicons/dist/codicon.ttf',
                //     to: 'vendor/vscode-codicons/'
                // },
                // // fontawesome
                // {
                //     from: './node_modules/@fortawesome/fontawesome-free/webfonts/',
                //     to: 'vendor/fontawesome/webfonts/'
                // },
                // {
                //     from: './node_modules/@fortawesome/fontawesome-free/css/all.min.css',
                //     to: 'vendor/fontawesome/css/'
                // },
                // // element-plus
                // {
                //     from: './node_modules/element-plus/lib/theme-chalk/fonts/',
                //     to: 'vendor/element-plus/lib/theme-chalk/fonts/'
                // },
                // {
                //     from: './node_modules/element-plus/lib/theme-chalk/index.css',
                //     to: 'vendor/element-plus/lib/theme-chalk/'
                // }
            ]
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false
            })
        ]
    }
};
