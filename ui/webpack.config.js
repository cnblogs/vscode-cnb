/* eslint-disable @typescript-eslint/naming-convention */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');
const path = require('path');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
        entries[key] = `./ui/${folder}/index.ts`;
        fs.cpSync(`./ui/${folder}/index.html`, `./dist/assets/ui/${folder}/index.html`);
    }

    const libPath = './ui/lib/';
    if (fs.existsSync(libPath)) {
        fs.cpSync(libPath, './dist/assets/ui/lib/', { recursive: true });
    }

    if (isDev) {
        console.log(entries);
    }
    return entries;
};

module.exports = {
    entry: buildEntry(),
    output: {
        path: path.resolve('dist/assets/ui'), //打包后的文件存放的地方
        filename: '[name].js', //打包后输出文件的文件名
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.css', '.js'],
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
                    'postcss-loader',
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
                // ts loader
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
        ],
    },
    plugins: [new MiniCssExtractPlugin()],
    devServer: {
        contentBase: './',
        hot: true,
    },
};
