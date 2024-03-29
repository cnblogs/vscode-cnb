//@ts-check

'use strict'

import path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { fileURLToPath } from 'url'
import webpack from 'webpack'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const preserveModules = [
    '@mapbox',
    'emoji-regex',
    'readable-stream',
    'abbrev',
    'gauge',
    'semver',
    'ansi-regex',
    'has-unicode',
    'set-blocking',
    'aproba',
    'inherits',
    'signal-exit',
    'are-we-there-yet',
    'is-fullwidth-code-point',
    'string-width',
    'color-support',
    'lru-cache',
    'strip-ansi',
    'console-control-strings',
    'nopt',
    'util-deprecate',
    'delegates',
    'npmlog',
    'wide-align',
    'detect-libc',
    'object-assign',
    'yallist',
    'sqlite3',
]

//@ts-check
/** @typedef {import("webpack").Configuration} WebpackConfig **/

export default (env, { mode }) => {
    const isProd = mode === 'production'

    return {
        target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
        mode: mode, // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

        entry: { extension: './src/extension.ts' }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
        output: {
            // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            libraryTarget: 'commonjs2',
        },
        externals: [
            {
                vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
                // modules added here also need to be added in the .vscodeignore file
            },
            'pg',
            'tedious',
            'pg-hstore',
            'sqlite3',
        ],
        resolve: {
            // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
            extensions: ['.ts', '.js', '.mjs'],
            plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'ts-loader',
                        },
                    ],
                },
                {
                    test: /\.mjs/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
            ],
        },
        devtool: 'nosources-source-map',
        infrastructureLogging: {
            level: 'log', // enables logging required for problem matchers
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        //Note:- No wildcard is specified hence will copy all files and folders
                        from: 'src/assets', //Will resolve to RepoDir/src/assets
                        to: 'assets', //Copies all files from above dest to dist/assets
                    },                    
                    {
                        from: 'src/wasm/rs_bg.wasm',
                        to: 'rs_bg.wasm',
                    },
                    ...preserveModules.map(m => ({ from: `node_modules/${m}`, to: `node_modules/${m}` })),
                ],
            }),
            new webpack.DefinePlugin({
                CNBLOGS_CLIENTID: JSON.stringify(env.CLIENTID || 'UNSET'),
                CNBLOGS_CLIENTSECRET: JSON.stringify(env.CLIENTSECRET || 'UNSET'),
            }),
        ],
        optimization: {
            chunkIds: isProd && !env.namedChunks ? 'deterministic' : 'named',
            usedExports: true,
        },
    }
}
