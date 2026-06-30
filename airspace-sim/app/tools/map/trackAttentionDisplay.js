import {getSignalLabel} from '../../simulation/signalDefinitions.js'
import {getLabelLongitudeCopies} from './bearingRangeGeometry.js'

export const ATTENTION_DISPLAY_MAX_LINES = 5
export const ATTENTION_FLASH_INTERVAL_MS = 500
export const TRACK_ATTENTION_OFFSET_X = 28
export const TRACK_ATTENTION_OFFSET_Y = -8


const ATTENTION_AMBER = '#FFBF00'

const ATTENTION_MAP_GLOW_SHADOW = '0 0 4px rgba(0, 0, 0, 0.85)'
const ATTENTION_MAP_TEXT_OUTLINE_SHADOW = [
    '-1px -1px 0 #000',
    '1px -1px 0 #000',
    '-1px 1px 0 #000',
    '1px 1px 0 #000',
    '0 -1px 0 #000',
    '0 1px 0 #000',
    '-1px 0 0 #000',
    '1px 0 0 #000',
].join(', ')

/**
 * @param {'light'|'dark'} paletteMode
 * @returns {{color: string, textShadow: string}}
 */
export function getAttentionMapLabelStyles(paletteMode) {
    if (paletteMode === 'light') {
        return {
            color: ATTENTION_AMBER,
            textShadow: ATTENTION_MAP_TEXT_OUTLINE_SHADOW,
        }
    }

    return {
        color: ATTENTION_AMBER,
        textShadow: ATTENTION_MAP_GLOW_SHADOW,
    }
}

/**
 * @param {string[]} flagIds Priority-sorted attention flag IDs
 * @returns {{key: string, label: string}[]}
 */
export function formatAttentionDisplayEntries(flagIds) {
    if (flagIds.length === 0) {
        return []
    }

    if (flagIds.length <= ATTENTION_DISPLAY_MAX_LINES) {
        return flagIds.map((flagId) => ({
            key: flagId,
            label: getSignalLabel(flagId),
        }))
    }

    const visibleCount = ATTENTION_DISPLAY_MAX_LINES - 1
    const overflowCount = flagIds.length - visibleCount

    return [
        ...flagIds.slice(0, visibleCount).map((flagId) => ({
            key: flagId,
            label: getSignalLabel(flagId),
        })),
        {
            key: '__overflow__',
            label: `+ ${overflowCount} MORE`,
        },
    ]
}

/**
 * @param {string[]} flagIds Priority-sorted attention flag IDs
 * @returns {string[]}
 */
export function formatAttentionDisplayLines(flagIds) {
    return formatAttentionDisplayEntries(flagIds).map((entry) => entry.label)
}

/**
 * @param {string} trackId
 * @param {number} lng
 * @returns {string}
 */
export function getTrackAttentionInstanceKey(trackId, lng) {
    return `${trackId}:${lng}`
}

/**
 * @param {{project: (coordinates: [number, number]) => {x: number, y: number}}} map
 * @param {string} trackId
 * @param {[number, number]} coordinates
 * @param {number} west
 * @param {number} east
 * @returns {{instanceKey: string, trackId: string, left: number, top: number}[]}
 */
export function projectTrackAttentionCopies(map, trackId, coordinates, west, east) {
    const [lng, lat] = coordinates
    const lngCopies = getLabelLongitudeCopies(lng, west, east)

    return lngCopies.map((copyLng) => {
        const projected = map.project([copyLng, lat])

        return {
            instanceKey: getTrackAttentionInstanceKey(trackId, copyLng),
            trackId,
            left: projected.x + TRACK_ATTENTION_OFFSET_X,
            top: projected.y + TRACK_ATTENTION_OFFSET_Y,
        }
    })
}

/**
 * @param {Record<string, {trackId: string, left: number, top: number}>} previous
 * @param {Record<string, {trackId: string, left: number, top: number}>} next
 * @returns {boolean}
 */
export function trackAttentionInstancesAreEqual(previous, next) {
    const nextKeys = Object.keys(next)

    if (Object.keys(previous).length !== nextKeys.length) {
        return false
    }

    return nextKeys.every((key) => {
        const previousInstance = previous[key]
        const nextInstance = next[key]

        return previousInstance
            && nextInstance
            && previousInstance.trackId === nextInstance.trackId
            && previousInstance.left === nextInstance.left
            && previousInstance.top === nextInstance.top
    })
}

export {ATTENTION_AMBER}

