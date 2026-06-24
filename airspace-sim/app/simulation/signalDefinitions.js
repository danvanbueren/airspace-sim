/**
 * Central registry for track attentions and alarm alerts.
 * Add or remove signal types here; all UI and simulation code should reference these IDs.
 */

export const SIGNAL_KIND = {
    ATTENTION: 'attention',
    ALERT: 'alert',
}

export const MISC_SIGNAL_ID = 'MISC'

/** @typedef {'attention'|'alert'} SignalKind */

/**
 * @typedef {Object} SignalDefinition
 * @property {string} id
 * @property {SignalKind} kind
 * @property {string} label Display label for map flags and settings table
 * @property {string} description Operator-facing description in settings
 * @property {number} priority Lower values appear first for track attentions
 */

/** @type {Record<string, SignalDefinition>} */
export const SIGNAL_DEFINITIONS = {
    DROP: {
        id: 'DROP',
        kind: SIGNAL_KIND.ATTENTION,
        label: 'DROP',
        description: 'Uncorrelated track scheduled for automatic removal.',
        priority: 5,
    },
    STALE: {
        id: 'STALE',
        kind: SIGNAL_KIND.ATTENTION,
        label: 'STALE',
        description: 'Track has not received a sensor update within the stale threshold.',
        priority: 10,
    },
    SUSPENDED: {
        id: 'SUSPENDED',
        kind: SIGNAL_KIND.ATTENTION,
        label: 'SUSPND',
        description: 'Track correlation is suspended and kinematics are frozen.',
        priority: 20,
    },
    EXTRAPOLATED: {
        id: 'EXTRAPOLATED',
        kind: SIGNAL_KIND.ATTENTION,
        label: 'EXTRAP',
        description: 'Track is extrapolating without active sensor correlation.',
        priority: 30,
    },
    HOLD: {
        id: 'HOLD',
        kind: SIGNAL_KIND.ATTENTION,
        label: 'HOLD',
        description: 'Operator kinematic edits are holding correlation updates.',
        priority: 40,
    },
    MAP_ERROR: {
        id: 'MAP_ERROR',
        kind: SIGNAL_KIND.ALERT,
        label: 'Map Error',
        description: 'MapLibre map load or runtime errors.',
        priority: 10,
    },
    BROWSER_ERROR: {
        id: 'BROWSER_ERROR',
        kind: SIGNAL_KIND.ALERT,
        label: 'Browser Error',
        description: 'Uncaught browser JavaScript errors.',
        priority: 20,
    },
    UNHANDLED_REJECTION: {
        id: 'UNHANDLED_REJECTION',
        kind: SIGNAL_KIND.ALERT,
        label: 'Promise Rejection',
        description: 'Unhandled promise rejections.',
        priority: 30,
    },
    REACT_ERROR: {
        id: 'REACT_ERROR',
        kind: SIGNAL_KIND.ALERT,
        label: 'React Error',
        description: 'React component render or lifecycle failures.',
        priority: 40,
    },
    UI_HOME: {
        id: 'UI_HOME',
        kind: SIGNAL_KIND.ALERT,
        label: 'Home Action',
        description: 'Fixed function panel HOME button placeholder alert.',
        priority: 50,
    },
    UI_CENTER_E3: {
        id: 'UI_CENTER_E3',
        kind: SIGNAL_KIND.ALERT,
        label: 'Center E-3 Action',
        description: 'Fixed function panel CENTER ON E-3 button placeholder alert.',
        priority: 60,
    },
    MISC: {
        id: MISC_SIGNAL_ID,
        kind: SIGNAL_KIND.ALERT,
        label: 'Misc',
        description: 'Fallback for alerts or attentions without an explicit definition.',
        priority: 999,
    },
}

export const ATTENTION_SIGNAL_IDS = Object.values(SIGNAL_DEFINITIONS)
    .filter((definition) => definition.kind === SIGNAL_KIND.ATTENTION)
    .map((definition) => definition.id)

export const ALERT_SIGNAL_IDS = Object.values(SIGNAL_DEFINITIONS)
    .filter((definition) => definition.kind === SIGNAL_KIND.ALERT)
    .map((definition) => definition.id)

/**
 * @param {string} signalId
 * @returns {SignalDefinition}
 */
export function getSignalDefinition(signalId) {
    return SIGNAL_DEFINITIONS[signalId] ?? SIGNAL_DEFINITIONS[MISC_SIGNAL_ID]
}

/**
 * @param {string} signalId
 * @returns {string}
 */
export function getSignalLabel(signalId) {
    return getSignalDefinition(signalId).label
}

/**
 * @param {SignalKind} kind
 * @returns {SignalDefinition[]}
 */
export function getSignalsByKind(kind) {
    return Object.values(SIGNAL_DEFINITIONS)
        .filter((definition) => definition.kind === kind && definition.id !== MISC_SIGNAL_ID)
        .sort((left, right) => left.priority - right.priority)
}

/**
 * @param {string[]} signalIds
 * @returns {string[]}
 */
export function sortSignalIdsByPriority(signalIds) {
    return [...new Set(signalIds)].sort((left, right) => {
        const leftPriority = getSignalDefinition(left).priority
        const rightPriority = getSignalDefinition(right).priority

        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority
        }

        return getSignalLabel(left).localeCompare(getSignalLabel(right))
    })
}

/**
 * @param {string[]} signalIds
 * @param {Set<string>|string[]} inhibitedSignalIds
 * @returns {string[]}
 */
export function filterInhibitedSignalIds(signalIds, inhibitedSignalIds = []) {
    const inhibited = inhibitedSignalIds instanceof Set
        ? inhibitedSignalIds
        : new Set(inhibitedSignalIds)

    return sortSignalIdsByPriority(signalIds).filter((signalId) => !inhibited.has(signalId))
}
