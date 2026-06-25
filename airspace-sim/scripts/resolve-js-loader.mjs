import {pathToFileURL} from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
        const resolved = pathToFileURL(path.join(projectRoot, specifier.slice(2))).href

        try {
            return await nextResolve(resolved, context)
        } catch {
            return await nextResolve(`${resolved}.js`, context)
        }
    }

    if (
        specifier.startsWith('.')
        && !specifier.endsWith('.js')
        && !specifier.endsWith('.json')
        && !specifier.endsWith('.mjs')
    ) {
        try {
            return await nextResolve(`${specifier}.js`, context)
        } catch {
            // fall through
        }
    }

    return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
        const source = await fs.promises.readFile(new URL(url), 'utf8')

        return {
            format: 'module',
            shortCircuit: true,
            source: `export default ${source}`,
        }
    }

    return nextLoad(url, context)
}
