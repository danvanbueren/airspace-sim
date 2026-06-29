#!/usr/bin/env node
/**
 * Writes CARTO basemap URLs from app/content/externalLinks.js into public map style JSON.
 * Run after changing tile URLs in externalLinks.js:
 *
 *   npm run sync:map-style-urls
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {EXTERNAL_LINKS} from '../app/content/externalLinks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MAP_STYLES_DIR = join(ROOT, 'public', 'map-styles')

const {carto} = EXTERNAL_LINKS

const STYLE_PATCHES = {
    'voyager-gl-style.json': {
        vectorTilesJson: carto.vectorTilesJson,
        sprite: carto.voyagerSprite,
        glyphs: carto.glyphs,
    },
    'dark-matter-gl-style.json': {
        vectorTilesJson: carto.vectorTilesJson,
        sprite: carto.darkMatterSprite,
        glyphs: carto.glyphs,
    },
}

function replaceJsonString(content, previousValue, nextValue) {
    if (!previousValue || previousValue === nextValue) {
        return content
    }

    return content.replaceAll(JSON.stringify(previousValue), JSON.stringify(nextValue))
}

function patchMapStyleFile(stylePath, patch) {
    const originalContent = readFileSync(stylePath, 'utf8')
    const style = JSON.parse(originalContent)

    let content = originalContent

    if (style.sources?.carto?.url) {
        content = replaceJsonString(content, style.sources.carto.url, patch.vectorTilesJson)
    }

    content = replaceJsonString(content, style.sprite, patch.sprite)
    content = replaceJsonString(content, style.glyphs, patch.glyphs)

    if (content !== originalContent) {
        writeFileSync(stylePath, content)
    }
}

for (const [filename, patch] of Object.entries(STYLE_PATCHES)) {
    const stylePath = join(MAP_STYLES_DIR, filename)
    patchMapStyleFile(stylePath, patch)
    console.log(`Checked ${filename}`)
}
