import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const mgrs = require('mgrs')

export const forward = mgrs.forward
export const inverse = mgrs.inverse
export const toPoint = mgrs.toPoint
