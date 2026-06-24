export const EMERGENCY_MODE3_CODES = ['7500', '7600', '7700']

export const MODE3_CODE_VFR_US = '1200'
export const MODE3_CODE_VFR_EU = '7000'

export const DEFAULT_EMERGENCY_MODE3_RATE = 0.01

export const IFF_MODE3_STALE_MULTIPLIER = 3

/**
 * @param {string|null|undefined} code
 * @returns {boolean}
 */
export function isValidMode3Code(code) {
    if (typeof code !== 'string' || code.length === 0) {
        return false
    }

    const normalized = formatMode3Code(code)

    return normalized.length === 4 && /^[0-7]{4}$/.test(normalized)
}

/**
 * @param {string|number|null|undefined} code
 * @returns {string}
 */
export function formatMode3Code(code) {
    if (code === null || code === undefined) {
        return ''
    }

    return String(code).padStart(4, '0').slice(-4)
}

/**
 * @param {string|null|undefined} code
 * @returns {boolean}
 */
export function isEmergencyMode3Code(code) {
    return EMERGENCY_MODE3_CODES.includes(formatMode3Code(code))
}

/**
 * @param {string|null|undefined} code
 * @returns {string|null}
 */
export function getEmergencyAttentionFlagId(code) {
    const normalized = formatMode3Code(code)

    if (normalized === '7700') {
        return 'IFF_EMER'
    }

    if (normalized === '7600') {
        return 'IFF_NORDO'
    }

    if (normalized === '7500') {
        return 'IFF_HIJ'
    }

    return null
}

/**
 * @param {string|null|undefined} code
 * @returns {string|null}
 */
export function getEmergencyAlertSignalId(code) {
    const normalized = formatMode3Code(code)

    if (normalized === '7700') {
        return 'IFF_EMER_ALERT'
    }

    if (normalized === '7600') {
        return 'IFF_NORDO_ALERT'
    }

    if (normalized === '7500') {
        return 'IFF_HIJ_ALERT'
    }

    return null
}

/**
 * @param {() => number} random
 * @param {{ emergencyRate?: number, vfr?: boolean, useEuropeanVfr?: boolean }} [options]
 * @returns {string}
 */
export function assignMode3Code(random, options = {}) {
    const emergencyRate = options.emergencyRate ?? DEFAULT_EMERGENCY_MODE3_RATE

    if (random() < emergencyRate) {
        return EMERGENCY_MODE3_CODES[Math.floor(random() * EMERGENCY_MODE3_CODES.length)]
    }

    if (options.vfr) {
        return options.useEuropeanVfr ? MODE3_CODE_VFR_EU : MODE3_CODE_VFR_US
    }

    let code = ''

    do {
        code = Array.from({length: 4}, () => Math.floor(random() * 8)).join('')
    } while (EMERGENCY_MODE3_CODES.includes(code) || code === '0000')

    return code
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @param {number} [iffRefreshMs]
 * @returns {boolean}
 */
export function isIffMode3Stale(track, evaluationTime = Date.now(), iffRefreshMs = 1000) {
    if (!track?.iffMode3Code) {
        return false
    }

    const updatedAt = track.iffMode3UpdatedAt ?? 0
    const staleThresholdMs = iffRefreshMs * IFF_MODE3_STALE_MULTIPLIER

    return evaluationTime - updatedAt > staleThresholdMs
}

/**
 * @param {string|null|undefined} code
 * @returns {string}
 */
export function getMode3DisplayLabel(code) {
    const normalized = formatMode3Code(code)

    if (!normalized) {
        return '—'
    }

    if (normalized === '7700') {
        return `${normalized} (Emergency)`
    }

    if (normalized === '7600') {
        return `${normalized} (NORDO)`
    }

    if (normalized === '7500') {
        return `${normalized} (Hijack)`
    }

    return normalized
}
