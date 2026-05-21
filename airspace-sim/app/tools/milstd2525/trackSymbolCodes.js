export const TRACK_DOMAINS = {
    AIR: 'air',
    LAND: 'land',
    SURFACE: 'surface',
    SUBSURFACE: 'subsurface',
    SPACE: 'space',
}

export const TRACK_IDENTITIES = {
    FRIENDLY: 'friendly',
    HOSTILE: 'hostile',
    NEUTRAL: 'neutral',
    UNKNOWN: 'unknown',
}

export const TRACK_TYPES = {
    FIGHTER: 'fighter',
    TANKER: 'tanker',
    AWACS: 'awacs',
    SURFACE_COMBATANT: 'surfaceCombatant',
    SUBMARINE: 'submarine',
    GROUND_UNIT: 'groundUnit',
}

export const TRACK_SYMBOL_CODES = {
    [TRACK_DOMAINS.AIR]: {
        [TRACK_IDENTITIES.FRIENDLY]: {
            [TRACK_TYPES.FIGHTER]: 'SFGPUCI----K',
            [TRACK_TYPES.TANKER]: 'SFGPUCA----K',
            [TRACK_TYPES.AWACS]: 'SFGPUAE----K',
        },
        [TRACK_IDENTITIES.HOSTILE]: {
            [TRACK_TYPES.FIGHTER]: 'SHGPUCI----K',
            [TRACK_TYPES.TANKER]: 'SHGPUCA----K',
            [TRACK_TYPES.AWACS]: 'SHGPUAE----K',
        },
        [TRACK_IDENTITIES.UNKNOWN]: {
            [TRACK_TYPES.FIGHTER]: 'SUGPUCI----K',
            [TRACK_TYPES.TANKER]: 'SUGPUCA----K',
            [TRACK_TYPES.AWACS]: 'SUGPUAE----K',
        },
        [TRACK_IDENTITIES.NEUTRAL]: {
            [TRACK_TYPES.FIGHTER]: 'SNGPUCI----K',
            [TRACK_TYPES.TANKER]: 'SNGPUCA----K',
            [TRACK_TYPES.AWACS]: 'SNGPUAE----K',
        },
    },

    [TRACK_DOMAINS.SURFACE]: {
        [TRACK_IDENTITIES.FRIENDLY]: {
            [TRACK_TYPES.SURFACE_COMBATANT]: 'SFGPUWS----K',
        },
        [TRACK_IDENTITIES.HOSTILE]: {
            [TRACK_TYPES.SURFACE_COMBATANT]: 'SHGPUWS----K',
        },
        [TRACK_IDENTITIES.UNKNOWN]: {
            [TRACK_TYPES.SURFACE_COMBATANT]: 'SUGPUWS----K',
        },
        [TRACK_IDENTITIES.NEUTRAL]: {
            [TRACK_TYPES.SURFACE_COMBATANT]: 'SNGPUWS----K',
        },
    },

    [TRACK_DOMAINS.SUBSURFACE]: {
        [TRACK_IDENTITIES.FRIENDLY]: {
            [TRACK_TYPES.SUBMARINE]: 'SFGPUUS----K',
        },
        [TRACK_IDENTITIES.HOSTILE]: {
            [TRACK_TYPES.SUBMARINE]: 'SHGPUUS----K',
        },
        [TRACK_IDENTITIES.UNKNOWN]: {
            [TRACK_TYPES.SUBMARINE]: 'SUGPUUS----K',
        },
        [TRACK_IDENTITIES.NEUTRAL]: {
            [TRACK_TYPES.SUBMARINE]: 'SNGPUUS----K',
        },
    },

    [TRACK_DOMAINS.LAND]: {
        [TRACK_IDENTITIES.FRIENDLY]: {
            [TRACK_TYPES.GROUND_UNIT]: 'SFGPU----------',
        },
        [TRACK_IDENTITIES.HOSTILE]: {
            [TRACK_TYPES.GROUND_UNIT]: 'SHGPU----------',
        },
        [TRACK_IDENTITIES.UNKNOWN]: {
            [TRACK_TYPES.GROUND_UNIT]: 'SUGPU----------',
        },
        [TRACK_IDENTITIES.NEUTRAL]: {
            [TRACK_TYPES.GROUND_UNIT]: 'SNGPU----------',
        },
    },
}

export function getTrackSymbolCode({domain, identity, type}) {
    return TRACK_SYMBOL_CODES?.[domain]?.[identity]?.[type] ?? 'SUGPU----------'
}