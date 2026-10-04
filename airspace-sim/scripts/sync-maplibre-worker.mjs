#!/usr/bin/env node
import {copyFileSync, existsSync, mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST_DIR = join(ROOT, 'node_modules', 'maplibre-gl', 'dist')
const TARGET_DIR = join(ROOT, 'public', 'lib', 'maplibre-gl')

const FILES = [
    'maplibre-gl-worker.mjs',
    'maplibre-gl-worker.mjs.map',
    'maplibre-gl-shared.mjs',
    'maplibre-gl-shared.mjs.map',
]

if (!existsSync(DIST_DIR)) {
    console.error(`MapLibre dist folder not found at ${DIST_DIR}. Run bun install first.`)
    process.exit(1)
}

if (!existsSync(TARGET_DIR)) {
    mkdirSync(TARGET_DIR, {recursive: true})
}

for (const file of FILES) {
    const src = join(DIST_DIR, file)
    const dst = join(TARGET_DIR, file)
    if (existsSync(src)) {
        copyFileSync(src, dst)
        console.log(`Copied ${file} -> public/lib/maplibre-gl/${file}`)
    }
}
