import {getSignalLabel} from '../../simulation/signalDefinitions.js'

export const ATTENTION_DISPLAY_MAX_LINES = 5
export const ATTENTION_FLASH_INTERVAL_MS = 500

const ATTENTION_AMBER = '#FFBF00'

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
