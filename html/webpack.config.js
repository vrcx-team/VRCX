const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');

module.exports = {
    entry: {
        app: ['./src/app.js', './src/app.scss'],
        'app.dark': './src/app.dark.scss',
        vr: ['./src/vr.js', './src/vr.scss']
    },
    output: {
        path: __dirname,
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.pug$/,
                use: 'pug-loader'
            }
        ]
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
        new RemovePlugin({
            after: {
                include: [
                    './app.dark.js'
                ],
                log: false,
                logWarning: false
            }
        })
    ]
};
