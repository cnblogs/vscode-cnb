/* eslint-disable @typescript-eslint/naming-convention */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');
const path = require('path');
const tailwindConfig = require('./tailwind.config');
/** @type {any} */
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const isDev = process.env.ASPNETCORE_ENVIRONMENT === 'Development' || process.env.NODE_ENV === 'development';

fs.rmSync('./dist/assets/ui/**', { force: true, recursive: true });

const buildEntry = () => {
    const entries = {};
    const folders = fs
        .readdirSync('ui', { withFileTypes: true })
        .filter(x => x.isDirectory() && !['share', 'dist', 'lib'].includes(x.name))
        .map(x => x.name);
    for (let folder of folders) {
        const key = `${folder}/index`;
        entries[key] = `./ui/${folder}/index.tsx`;
        fs.cpSync(`./ui/${folder}/index.html`, `./dist/assets/ui/${folder}/index.html`, { force: true });
    }

    const libPath = './ui/lib/';
    if (fs.existsSync(libPath)) {
        fs.cpSync(libPath, './dist/assets/ui/lib/', { recursive: true });
    }
    fs.cpSync('./node_modules/@fluentui/font-icons-mdl2/fonts/', './dist/assets/fonts/', { recursive: true });

    if (isDev) {
        console.log(entries);
    }
    return entries;
};

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
module.exports = {
    entry: buildEntry(),
    output: {
        path: path.resolve('dist/assets/ui'), //打包后的文件存放的地方
        filename: '[name].js', //打包后输出文件的文件名
    },
    resolve: {
        extensions: ['.tsx', '.ts', 'less', '.css', '.js'],
        plugins: [new TsconfigPathsPlugin({ configFile: './ui/tsconfig.json' })],
    },
    devtool: isDev ? 'eval-source-map' : false,
    mode: isDev ? 'development' : 'production',
    module: {
        rules: [
            {
                test: /\.(c|le)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            import: true,
                            sourceMap: isDev,
                            url: false,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [['tailwindcss', tailwindConfig], 'autoprefixer'],
                            },
                        },
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                javascriptEnabled: true,
                            },
                        },
                    },
                ],
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
        ],
    },
    performance: {
        hints: false,
    },

    plugins: [
        new MiniCssExtractPlugin(),
        {
            apply: compiler => {
                compiler.hooks.watchRun.tap('customPreTask', () => {
                    buildEntry();
                });
            },
        },
    ],
};
