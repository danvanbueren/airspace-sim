import {NATIONALITY_CATALOG} from './trackNationalitiesData.js'
import {UNSPECIFIED_OPTION} from './trackPlatformCatalog/helpers.js'

export const NATIONALITY_OPTIONS = [UNSPECIFIED_OPTION, ...NATIONALITY_CATALOG]

const NATIONALITY_VALUES = new Set(NATIONALITY_OPTIONS.map((option) => option.value))

export function getNationalityOptions() {
    return NATIONALITY_OPTIONS
}

export function getDefaultNationality() {
    return UNSPECIFIED_OPTION.value
}

export function normalizeNationality(nationality) {
    const normalizedValue = nationality ?? ''

    if (NATIONALITY_VALUES.has(normalizedValue)) {
        return normalizedValue
    }

    return getDefaultNationality()
}
