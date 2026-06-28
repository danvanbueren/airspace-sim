import ms from 'milsymbol'

export const TRACK_DOMAINS = {
    AIR: 'air',
    LAND: 'land',
    SURFACE: 'surface',
    SUBSURFACE: 'subsurface',
    SPACE: 'space',
    ACTIVITY: 'activity',
    CYBERSPACE: 'cyberspace',
}

export function normalizeTrackDomain(domain) {
    if (domain && Object.values(TRACK_DOMAINS).includes(domain)) {
        return domain
    }

    return TRACK_DOMAINS[String(domain ?? '').toUpperCase()] ?? TRACK_DOMAINS.AIR
}

export const TRACK_IDENTITIES = {
    PENDING: 'pending',
    NEUTRAL: 'neutral',
    UNKNOWN: 'unknown',
    ASSUMED_FRIENDLY: 'assumedFriendly',
    FRIENDLY: 'friendly',
    SUSPECT: 'suspect',
    HOSTILE: 'hostile',
}

export const TRACK_IDENTITY_OPTIONS = [
    {value: TRACK_IDENTITIES.PENDING, label: 'Pending'},
    {value: TRACK_IDENTITIES.UNKNOWN, label: 'Unknown'},
    {value: TRACK_IDENTITIES.ASSUMED_FRIENDLY, label: 'Assumed Friendly'},
    {value: TRACK_IDENTITIES.FRIENDLY, label: 'Friendly'},
    {value: TRACK_IDENTITIES.NEUTRAL, label: 'Neutral'},
    {value: TRACK_IDENTITIES.SUSPECT, label: 'Suspect'},
    {value: TRACK_IDENTITIES.HOSTILE, label: 'Hostile'},
]

export const TRACK_TYPES = {
    AIR_UNSPECIFIED: '01:000000',
    CIVILIAN_AIR: '01:120000',
    GENERAL_AVIATION: '01:120100',
    FIGHTER: '01:110104',
    TANKER: '01:110109',
    AWACS: '01:110116',
    SURFACE_COMBATANT: '30:120000',
    SUBMARINE: '35:110100',
    GROUND_UNIT: '10:000000',
    SPACE_UNIT: '05:000000',
    ACTIVITY: '40:000000',
    CYBERSPACE: '60:000000',
}

const TRACK_IDENTITY_AFFILIATION_CODES = {
    [TRACK_IDENTITIES.PENDING]: '0',
    [TRACK_IDENTITIES.UNKNOWN]: '1',
    [TRACK_IDENTITIES.ASSUMED_FRIENDLY]: '2',
    [TRACK_IDENTITIES.FRIENDLY]: '3',
    [TRACK_IDENTITIES.NEUTRAL]: '4',
    [TRACK_IDENTITIES.SUSPECT]: '5',
    [TRACK_IDENTITIES.HOSTILE]: '6',
}

const SYMBOL_SET_CONFIGS = [
    {symbolSet: '01', domain: TRACK_DOMAINS.AIR, label: 'Air'},
    {symbolSet: '02', domain: TRACK_DOMAINS.AIR, label: 'Air Missile'},
    {symbolSet: '05', domain: TRACK_DOMAINS.SPACE, label: 'Space'},
    {symbolSet: '06', domain: TRACK_DOMAINS.SPACE, label: 'Space Missile'},
    {symbolSet: '10', domain: TRACK_DOMAINS.LAND, label: 'Land Unit'},
    {symbolSet: '11', domain: TRACK_DOMAINS.LAND, label: 'Land Civilian Unit'},
    {symbolSet: '15', domain: TRACK_DOMAINS.LAND, label: 'Land Equipment'},
    {symbolSet: '20', domain: TRACK_DOMAINS.LAND, label: 'Land Installation'},
    {symbolSet: '27', domain: TRACK_DOMAINS.LAND, label: 'Dismounted Individual'},
    {symbolSet: '30', domain: TRACK_DOMAINS.SURFACE, label: 'Sea Surface'},
    {symbolSet: '35', domain: TRACK_DOMAINS.SUBSURFACE, label: 'Sea Subsurface'},
    {symbolSet: '36', domain: TRACK_DOMAINS.SUBSURFACE, label: 'Mine Warfare'},
    {symbolSet: '40', domain: TRACK_DOMAINS.ACTIVITY, label: 'Activity'},
    {symbolSet: '50', domain: TRACK_DOMAINS.SPACE, label: 'SIGINT Space'},
    {symbolSet: '51', domain: TRACK_DOMAINS.AIR, label: 'SIGINT Air'},
    {symbolSet: '52', domain: TRACK_DOMAINS.LAND, label: 'SIGINT Land'},
    {symbolSet: '53', domain: TRACK_DOMAINS.SURFACE, label: 'SIGINT Surface'},
    {symbolSet: '54', domain: TRACK_DOMAINS.SUBSURFACE, label: 'SIGINT Subsurface'},
    {symbolSet: '60', domain: TRACK_DOMAINS.CYBERSPACE, label: 'Cyberspace'},
]

const LEGACY_TRACK_TYPE_ALIASES = {
    fighter: TRACK_TYPES.FIGHTER,
    tanker: TRACK_TYPES.TANKER,
    awacs: TRACK_TYPES.AWACS,
    surfaceCombatant: TRACK_TYPES.SURFACE_COMBATANT,
    submarine: TRACK_TYPES.SUBMARINE,
    groundUnit: TRACK_TYPES.GROUND_UNIT,
}

const DEFAULT_TRACK_TYPE_BY_DOMAIN = {
    [TRACK_DOMAINS.AIR]: TRACK_TYPES.FIGHTER,
    [TRACK_DOMAINS.LAND]: TRACK_TYPES.GROUND_UNIT,
    [TRACK_DOMAINS.SURFACE]: TRACK_TYPES.SURFACE_COMBATANT,
    [TRACK_DOMAINS.SUBSURFACE]: TRACK_TYPES.SUBMARINE,
    [TRACK_DOMAINS.SPACE]: TRACK_TYPES.SPACE_UNIT,
    [TRACK_DOMAINS.ACTIVITY]: TRACK_TYPES.ACTIVITY,
    [TRACK_DOMAINS.CYBERSPACE]: TRACK_TYPES.CYBERSPACE,
}

const SIDC_2525D_PATTERN = /^\d{20}$/
const FALLBACK_SYMBOL_CODE = '10011000000000000000'
const SYMBOL_LABEL_ACRONYMS = new Set([
    'AAA',
    'AUV',
    'CBRN',
    'EA',
    'EOD',
    'HQ',
    'IED',
    'MCM',
    'MISO',
    'NBC',
    'SAR',
    'SIGINT',
    'SOF',
    'UAV',
    'UUV',
    'VIP',
    'VSTOL',
])

function createCatalogIconProxy() {
    return new Proxy({}, {
        get: (_target, property) => ({
            __trackSymbolIconKey: String(property),
        }),
    })
}

function findIconKey(iconParts) {
    if (!Array.isArray(iconParts)) {
        return iconParts?.__trackSymbolIconKey
    }

    for (const iconPart of iconParts) {
        const iconKey = findIconKey(iconPart)

        if (iconKey) {
            return iconKey
        }
    }

    return null
}

function formatSymbolLabel(iconKey) {
    if (!iconKey) {
        return null
    }

    const label = iconKey
        .split('.')
        .at(-1)
        .replace(/\bDSymbol\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()

    return label
        .toLowerCase()
        .replace(/\b[a-z0-9][a-z0-9/-]*/g, (word) => {
            const acronym = word.toUpperCase()

            if (acronym.split('/').every((part) => SYMBOL_LABEL_ACRONYMS.has(part))) {
                return acronym
            }

            return word.charAt(0).toUpperCase() + word.slice(1)
        })
}

function createTrackTypeOption(config, entity, label) {
    return {
        value: `${config.symbolSet}:${entity}`,
        label: `${config.label} - ${label}`,
        shortLabel: label,
        symbolSet: config.symbolSet,
        symbolSetLabel: config.label,
        entity,
        domain: config.domain,
    }
}

function getSymbolSetEntities(symbolSet) {
    const entitiesByCode = new Map()
    const iconProxy = createCatalogIconProxy()

    ms._iconSIDC?.number?.forEach((buildIconSidc) => {
        const sId = {}

        try {
            buildIconSidc(sId, {}, {}, {}, symbolSet, iconProxy, true)
        } catch {
            return
        }

        Object.entries(sId).forEach(([entity, iconParts]) => {
            if (!/^\d{6}$/.test(entity) || !Array.isArray(iconParts) || iconParts.length === 0) {
                return
            }

            const label = formatSymbolLabel(findIconKey(iconParts))

            if (label) {
                entitiesByCode.set(entity, label)
            }
        })
    })

    return entitiesByCode
}

function buildTrackSymbolCatalog() {
    const optionsByDomain = Object.fromEntries(
        Object.values(TRACK_DOMAINS).map((domain) => [domain, []]),
    )
    const optionsByValue = {}

    SYMBOL_SET_CONFIGS.forEach((config) => {
        const options = [
            createTrackTypeOption(config, '000000', 'Unspecified'),
        ]

        getSymbolSetEntities(config.symbolSet).forEach((label, entity) => {
            options.push(createTrackTypeOption(config, entity, label))
        })

        options.forEach((option) => {
            optionsByValue[option.value] = option
            optionsByDomain[config.domain].push(option)
        })
    })

    return {
        optionsByDomain,
        optionsByValue,
    }
}

const TRACK_SYMBOL_CATALOG = buildTrackSymbolCatalog()

export const TRACK_TYPE_OPTIONS_BY_DOMAIN = TRACK_SYMBOL_CATALOG.optionsByDomain

export const TRACK_TYPES_BY_DOMAIN = Object.fromEntries(
    Object.entries(TRACK_TYPE_OPTIONS_BY_DOMAIN).map(([domain, options]) => [
        domain,
        options.map((option) => option.value),
    ]),
)

export const TRACK_SYMBOL_CODES = Object.fromEntries(
    Object.values(TRACK_DOMAINS).map((domain) => [
        domain,
        Object.fromEntries(
            Object.values(TRACK_IDENTITIES).map((identity) => [
                identity,
                Object.fromEntries(
                    (TRACK_TYPE_OPTIONS_BY_DOMAIN[domain] ?? []).map((option) => [
                        option.value,
                        getTrackSymbolCode({identity, type: option.value}),
                    ]),
                ),
            ]),
        ),
    ]),
)

export function normalizeTrackType(type, domain) {
    if (SIDC_2525D_PATTERN.test(type ?? '')) {
        return type
    }

    const normalizedType = LEGACY_TRACK_TYPE_ALIASES[type] ?? type

    if (TRACK_SYMBOL_CATALOG.optionsByValue[normalizedType]) {
        return normalizedType
    }

    return getDefaultTrackTypeForDomain(domain)
}

export function getDefaultTrackTypeForDomain(domain) {
    const normalizedDomain = normalizeTrackDomain(domain)

    return DEFAULT_TRACK_TYPE_BY_DOMAIN[normalizedDomain]
        ?? TRACK_TYPE_OPTIONS_BY_DOMAIN[normalizedDomain]?.[0]?.value
        ?? TRACK_TYPES.GROUND_UNIT
}

export function getUnspecifiedTrackTypeForDomain(domain) {
    return getTrackTypeOptionsForDomain(domain)[0]?.value
        ?? TRACK_TYPES.GROUND_UNIT
}

export function getTrackTypeOptionsForDomain(domain) {
    return TRACK_TYPE_OPTIONS_BY_DOMAIN[normalizeTrackDomain(domain)] ?? []
}

function isTrackTypeValidForDomain(type, domain) {
    return getTrackTypeOptionsForDomain(domain).some((option) => option.value === type)
}

export function getTrackTypeOption(type, domain) {
    const normalizedType = normalizeTrackType(type, domain)
    const option = TRACK_SYMBOL_CATALOG.optionsByValue[normalizedType]

    if (!option || !isTrackTypeValidForDomain(normalizedType, domain)) {
        return null
    }

    return option
}

export function resolveTrackTypeForDomain(type, domain) {
    return getTrackTypeOption(type, domain)?.value ?? getUnspecifiedTrackTypeForDomain(domain)
}

export function getTrackSymbolCode({domain, identity, type} = {}) {
    if (SIDC_2525D_PATTERN.test(type ?? '')) {
        return type
    }

    const option = getTrackTypeOption(type, domain)

    if (!option) {
        return FALLBACK_SYMBOL_CODE
    }

    const affiliation = TRACK_IDENTITY_AFFILIATION_CODES[identity]
        ?? TRACK_IDENTITY_AFFILIATION_CODES[TRACK_IDENTITIES.UNKNOWN]

    return `100${affiliation}${option.symbolSet}0000${option.entity}0000`
}

export function getTrackSymbolOptions() {
    return {}
}