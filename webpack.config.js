const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { EsbuildPlugin } = require('esbuild-loader');

const scssBasePath = './src/assets/scss/';
const themeBasePath = `${scssBasePath}themes/`;

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    return {
        entry: {
            vendor: ['element-ui', 'noty', 'vue', 'vue-i18n', 'worker-timers'],
            app: {
                import: ['./src/app.js', './src/app.scss'],
                dependOn: 'vendor'
            },
            vr: {
                import: ['./src/vr.js', './src/vr.scss'],
                dependOn: 'vendor'
            },
            'theme.dark': `${themeBasePath}theme.dark.scss`,
            'theme.darkblue': `${themeBasePath}theme.darkblue.scss`,
            'theme.darkvanillaold': `${themeBasePath}theme.darkvanillaold.scss`,
            'theme.darkvanilla': `${themeBasePath}theme.darkvanilla.scss`,
            'theme.pink': `${themeBasePath}theme.pink.scss`,
            'theme.material3': `${themeBasePath}theme.material3.scss`
        },
        output: {
            path: path.resolve(__dirname, 'build/html'),
            filename: '[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    resourceQuery: { not: /vue/ },
                    loader: 'esbuild-loader',
                    options: {
                        target: 'es2022'
                    }
                },
                {
                    test: /\.pug$/,
                    use: ['raw-loader', 'pug-plain-loader']
                },
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    quietDeps: true
                                }
                            }
                        }
                    ]
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
        devServer: {
            port: 9000,
            client: {
                overlay: {
                    warnings: false,
                    errors: true
                }
            }
        },
        resolve: {
            extensions: ['.js', '.vue', '.css', '.scss'],
            alias: {
                vue: 'vue/dist/vue.esm.js'
            }
        },
        performance: {
            hints: false
        },
        devtool: 'inline-source-map',
        target: ['web', 'es2022'],
        stats: {
            preset: 'errors-warnings',
            timings: true
        },
        plugins: [
            new webpack.DefinePlugin({
                LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
                WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows'),
                __VUE_I18N_LEGACY_API__: JSON.stringify(false),
                __VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
                __INTLIFY_DROP_MESSAGE_COMPILER__: JSON.stringify(true)
            }),
            new VueLoaderPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './src/static/index.html',
                inject: true,
                chunks: ['vendor', 'app']
            }),
            new HtmlWebpackPlugin({
                filename: 'vr.html',
                template: './src/static/vr.html',
                inject: true,
                chunks: ['vendor', 'vr']
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: './images/',
                        to: './images/'
                    }
                ]
            }),
            new webpack.ProgressPlugin({})
        ],
        optimization: {
            minimizer: isProduction
                ? [
                      new EsbuildPlugin({
                          css: true,
                          sourcemap: true
                      })
                  ]
                : [],
            splitChunks: {
                chunks: 'all'
            }
        },
        watchOptions: {
            ignored: /node_modules/
        }
    };
};
