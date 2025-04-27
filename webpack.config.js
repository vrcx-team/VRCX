const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { EsbuildPlugin } = require('esbuild-loader');

const scssBasePath = './src/assets/scss/';
const themeBasePath = `${scssBasePath}themes/`;

module.exports = {
    entry: {
        vendor: [
            'element-ui',
            'noty',
            'vue',
            'vue-data-tables',
            'vue-lazyload',
            'dayjs'
        ],
        app: {
            import: ['./src/app.js', './src/app.scss'],
            dependOn: 'vendor'
        },
        'theme.dark': `${themeBasePath}theme.dark.scss`,
        'theme.darkvanillaold': `${themeBasePath}theme.darkvanillaold.scss`,
        'theme.darkvanilla': `${themeBasePath}theme.darkvanilla.scss`,
        'theme.pink': `${themeBasePath}theme.pink.scss`,
        'theme.material3': `${themeBasePath}theme.material3.scss`,
        flags: `${scssBasePath}flags.scss`,
        'animated-emoji': `${scssBasePath}animated-emoji.scss`,
        'emoji.font': `${scssBasePath}emoji.font.scss`,
        vr: {
            import: ['./src/vr.js', './src/vr.scss'],
            dependOn: 'vendor'
        }
    },
    output: {
        path: path.resolve(__dirname, 'build/html'),
        filename: '[name].js',
        library: {
            type: 'window'
        }
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'js',
                    target: 'esnext',
                    legalComments: 'inline'
                }
            },
            {
                test: /\.pug$/,
                use: [{ loader: 'raw-loader' }, { loader: 'pug-plain-loader' }]
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
        extensions: ['.js', '.css', '.scss'],
        alias: {
            vue: 'vue/dist/vue.esm.js'
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
        new webpack.DefinePlugin({
            LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
            WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows')
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/static/index.html',
            inject: false,
            minify: false
        }),
        new HtmlWebpackPlugin({
            filename: 'vr.html',
            template: './src/static/vr.html',
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
            ]
        }),
        new webpack.ProgressPlugin({})
    ],
    optimization: {
        minimizer: [
            new EsbuildPlugin({
                target: 'es2020'
            })
        ]
    },
    watchOptions: {
        ignored: /node_modules/
    }
};
