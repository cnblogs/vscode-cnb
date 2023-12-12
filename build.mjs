import esbuild from 'esbuild'
import * as process from 'node:process'

const isProduction = process.argv.includes('--production')

/** @type {esbuild.BuildOptions} */
const options = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outdir: 'out',
    external: ['vscode'],
    format: 'cjs',
    sourcemap: !isProduction,
    minify: isProduction,
    platform: 'node',
    logLevel: 'info',
}

await esbuild.build(options)
