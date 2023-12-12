import esbuild from 'esbuild'
import copyPluginPkg from '@sprout2000/esbuild-copy-plugin'
import * as process from 'node:process'

const { copyPlugin } = copyPluginPkg
const isProduction = process.argv.includes('--production')
const OUT_DIR = 'dist'

async function buildExtension(isProduction) {
    const options = {
        entryPoints: ['./src/extension.ts'],
        bundle: true,
        outdir: OUT_DIR,
        packages: 'external',
        external: ['vscode'],
        format: 'cjs',
        sourcemap: !isProduction,
        minify: isProduction,
        platform: 'node',
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
                src: 'src/wasm/rs_bg.wasm',
                dest: `${OUT_DIR}/rs_bg.wasm`,
            }),
        ],
    }

    await esbuild.build(options)
}

await buildExtension(isProduction)
