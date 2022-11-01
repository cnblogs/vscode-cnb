/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/naming-convention */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { rmSync, readdirSync, cpSync, existsSync } from 'fs';
import { resolve } from 'path';
import tailwindConfig from './tailwind.config.js';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const isDev = process.env.ASPNETCORE_ENVIRONMENT === 'Development' || process.env.NODE_ENV === 'development';

rmSync('./dist/assets/ui/**', { force: true, recursive: true });

const buildEntry = () => {
    /**
     * @type {Record<string, string>}
     */
    const entries = {};
    const folders = readdirSync('ui', { withFileTypes: true })
        .filter(x => x.isDirectory() && !['share', 'dist', 'lib'].includes(x.name))
        .map(x => x.name);
    for (let folder of folders) {
        const key = `${folder}/index`;
        entries[key] = `./ui/${folder}/index.tsx`;
        cpSync(`./ui/${folder}/index.html`, `./dist/assets/ui/${folder}/index.html`, { force: true });
    }

    const libPath = './ui/lib/';
    if (existsSync(libPath)) cpSync(libPath, './dist/assets/ui/lib/', { recursive: true });

    cpSync('./node_modules/@fluentui/font-icons-mdl2/fonts/', './dist/assets/fonts/', { recursive: true });

    if (isDev) console.log(entries);

    return entries;
};

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const config = {
    entry: buildEntry(),
    output: {
        path: resolve('dist/assets/ui'), //打包后的文件存放的地方
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

export default [config];
