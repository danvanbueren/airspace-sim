import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const stubPath = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), 'mgrs-node-stub.mjs')).href

export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'mgrs') {
        return {
            url: stubPath,
            shortCircuit: true,
        }
    }

    return nextResolve(specifier, context)
}
