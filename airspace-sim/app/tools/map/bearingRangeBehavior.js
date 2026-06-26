export const BEARING_RANGE_BEHAVIOR_MODES = {
    temporary_default: {
        value: 'temporary_default',
        label: 'Temporary by default',
        description: 'Measurements disappear on release. Hold the persist modifier to keep a line on the map.',
    },
    permanent_default: {
        value: 'permanent_default',
        label: 'Permanent by default',
        description: 'Lines stay on the map by default. Hold the persist modifier for a temporary measurement only.',
    },
    always_permanent: {
        value: 'always_permanent',
        label: 'Always permanent',
        description: 'Every measurement is kept on the map.',
    },
    never_permanent: {
        value: 'never_permanent',
        label: 'Never permanent',
        description: 'Measurements always disappear on release.',
    },
}

const BEARING_RANGE_BEHAVIOR_VALUES = new Set(Object.keys(BEARING_RANGE_BEHAVIOR_MODES))

export const DEFAULT_BEARING_RANGE_BEHAVIOR = BEARING_RANGE_BEHAVIOR_MODES.temporary_default.value

export function normalizeBearingRangeBehavior(value) {
    return BEARING_RANGE_BEHAVIOR_VALUES.has(value)
        ? value
        : DEFAULT_BEARING_RANGE_BEHAVIOR
}

export function shouldPersistBearingRangeLine(behaviorMode, modifierActive) {
    const mode = normalizeBearingRangeBehavior(behaviorMode)

    switch (mode) {
        case 'permanent_default':
            return !modifierActive
        case 'always_permanent':
            return true
        case 'never_permanent':
            return false
        case 'temporary_default':
        default:
            return modifierActive
    }
}

export function bearingRangeBehaviorUsesPersistModifier(behaviorMode) {
    const mode = normalizeBearingRangeBehavior(behaviorMode)

    return mode === 'temporary_default' || mode === 'permanent_default'
}
