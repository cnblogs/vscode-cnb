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

async function buildUI(...apps) {
    const srcPath = './ui/'
    const outPath = `${OUT_DIR}/assets/ui/`
    for (const app of apps) {
        const options = {
            ...defaultOptions,
            define: {
                'process.env.NODE_ENV': JSON.stringify('production'),
            },
            entryPoints: [`${srcPath}${app}/index.tsx`],
            outdir: `${outPath}${app}`,
            plugins: [
                lessLoader(),
                copyPlugin({
                    src: `${srcPath}${app}/index.html`,
                    dest: `${outPath}${app}/index.html`,
                }),
            ],
        }

        await esbuild.build(options)
    }
}

try {
    await Promise.allSettled([buildExtension(), buildUI('ing', 'post-cfg')])
} catch (ex) {
    // eslint-disable-next-line no-undef
    console.error(ex)
    process.exit(1)
}
