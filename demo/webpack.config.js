const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const IconfontPlugin = require('../index.js');

const resolve = path.resolve.bind(path, __dirname);

module.exports = {
    context: __dirname,
    entry: {
        index: './index.js',
        dirs: './dirs.js'
    },
    output: {
        path: resolve('build'),
        filename: '[name].js'
    },
    plugins: [
        new IconfontPlugin({
            src: resolve('icons-default'),
            family: 'iconfont',
            dest: {
                font: resolve('fonts/[family].[type]'),
                css: resolve('scss/_[family].scss')
            },
            watch: {
                cwd: __dirname,
                pattern: 'icons-default/*.svg'
            }
        }),
        new IconfontPlugin({
            src: resolve('icons-dirs'),
            dest: {
                font: resolve('fonts/[family].[type]'),
                css: resolve('scss/_[family].scss')
            },
            watch: {
                cwd: __dirname,
                pattern: 'icons-dirs/**/*.svg'
            }
        }),
        new IconfontPlugin({
            src: resolve('icons-default'),
            family: 'iconfont-alias',
            dest: {
                font: resolve('fonts/[family].[type]'),
                css: resolve('scss/_[family].scss'),
                alias: '@',
                aliasPath: __dirname
            },
            watch: {
                cwd: __dirname,
                pattern: 'icons-default/*.svg'
            }
        }),
        new ExtractTextPlugin('[name].css')
    ],
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'sass-loader']
                })
            },
            {
                test: /\.(svg|eot|ttf|woff|woff2)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            outputPath: 'fonts/'
                        }
                    }
                ]
            }
        ]
    },
};
