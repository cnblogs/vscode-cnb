import esbuild from 'esbuild'
import copyPluginPkg from '@sprout2000/esbuild-copy-plugin'
import { lessLoader } from 'esbuild-plugin-less'
import * as process from 'node:process'

const { copyPlugin } = copyPluginPkg
const isProduction = !process.argv.includes('--development')
const OUT_DIR = 'dist'

const defaultOptions = {
    format: 'cjs',
    resolveExtensions: ['.ts', '.js', '.mjs', '.tsx'],
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
        define: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CNBLOGS_CLIENTID: JSON.stringify(process.env.CLIENTID),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            CNBLOGS_CLIENTSECRET: JSON.stringify(process.env.CLIENTSECRET),
        },
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
                src: 'node_modules/@fluentui/font-icons-mdl2/fonts/',
                dest: `${OUT_DIR}/assets/fonts`,
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

async function buildUI(...apps) {
    for (const app of apps) {
        const options = {
            ...defaultOptions,
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
            },
            tsconfig: './ui/tsconfig.json',
            entryPoints: [`./ui/${app}/index.tsx`],
            outdir: `${OUT_DIR}/assets/ui/${app}`,
            plugins: [
                lessLoader(),
                copyPlugin({
                    src: `ui/${app}/index.html`,
                    dest: `${OUT_DIR}/assets/ui/${app}/index.html`,
                }),
            ],
        }

        await esbuild.build(options)
    }
}

await Promise.allSettled([buildExtension(), buildMarkdownItPlugins(), buildUI('ing', 'post-cfg')])
