import esbuild from 'esbuild'
import copyPluginPkg from '@sprout2000/esbuild-copy-plugin'
import * as process from 'node:process'

const { copyPlugin } = copyPluginPkg
const isProduction = process.argv.includes('--production')
const OUT_DIR = 'dist'

const defaultOptions = {
    format: 'cjs',
    resolveExtensions: ['.ts', '.js', '.mjs'],
    bundle: true,
    sourcemap: !isProduction,
    minify: isProduction,
    platform: 'node',
    outdir: OUT_DIR,
}

async function buildExtension() {
    const options = {
        ...defaultOptions,
        entryPoints: ['./src/extension.ts'],
        external: ['vscode', '@mapbox/node-pre-gyp', 'sequelize'],
        plugins: [
            copyPlugin({
                src: 'src/assets',
                dest: `${OUT_DIR}/assets`,
            }),
            copyPlugin({
                src: 'node_modules/@cnblogs/code-highlight-adapter/index.min.css',
                dest: `${OUT_DIR}/assets/styles/highlight-code-lines.css`,
            }),
            copyPlugin({
                src: 'node_modules/@mapbox/node-pre-gyp',
                dest: `${OUT_DIR}/node_modules/@mapbox/node-pre-gyp`,
            }),
            copyPlugin({
                src: 'node_modules/sequelize',
                dest: `${OUT_DIR}/node_modules/sequelize`,
            }),
            copyPlugin({
                src: 'src/wasm/rs_bg.wasm',
                dest: `${OUT_DIR}/rs_bg.wasm`,
            }),
        ],
    }

    await esbuild.build(options)
}

async function buildMarkdownItPlugins() {
    const options = {
        ...defaultOptions,
        entryPoints: ['./src/markdown/markdown.entry.ts'],
        outdir: '',
        outfile: `${OUT_DIR}/markdown.js`,
    }

    await esbuild.build(options)
}

await Promise.allSettled([buildExtension(), buildMarkdownItPlugins()])
