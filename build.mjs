import esbuild from 'esbuild'
import copyPluginPkg from '@sprout2000/esbuild-copy-plugin'
import * as process from 'node:process'

const { copyPlugin } = copyPluginPkg
const isProduction = process.argv.includes('--production')

/** @type {esbuild.BuildOptions} */
const options = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outdir: 'out',
    packages: 'external',
    external: ['vscode'],
    format: 'cjs',
    sourcemap: !isProduction,
    minify: isProduction,
    platform: 'node',
    logLevel: 'info',
    plugins: [
        copyPlugin({
            src: './src/assets',
            dest: './out/assets',
        }),
    ],
}

await esbuild.build(options)
