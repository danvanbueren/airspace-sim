import {getSignalLabel} from '../../simulation/signalDefinitions.js'

export const ATTENTION_DISPLAY_MAX_LINES = 5
export const ATTENTION_FLASH_INTERVAL_MS = 500

const ATTENTION_AMBER = '#FFBF00'
const ATTENTION_AMBER_LIGHT_MODE = '#C9A000'

const ATTENTION_MAP_GLOW_SHADOW = '0 0 4px rgba(0, 0, 0, 0.85)'
const ATTENTION_MAP_TEXT_OUTLINE_SHADOW = [
    '-1px -1px 0 #fff',
    '1px -1px 0 #fff',
    '-1px 1px 0 #fff',
    '1px 1px 0 #fff',
    '0 -1px 0 #fff',
    '0 1px 0 #fff',
    '-1px 0 0 #fff',
    '1px 0 0 #fff',
].join(', ')

/**
 * @param {'light'|'dark'} paletteMode
 * @returns {{color: string, textShadow: string}}
 */
export function getAttentionMapLabelStyles(paletteMode) {
    if (paletteMode === 'light') {
        return {
            color: ATTENTION_AMBER_LIGHT_MODE,
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

export {ATTENTION_AMBER}
