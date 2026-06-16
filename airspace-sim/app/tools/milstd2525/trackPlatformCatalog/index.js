import {TRACK_TYPES} from '../trackSymbolCodes.js'
import {UNSPECIFIED_OPTION} from './helpers.js'
import {FIGHTER_PLATFORMS} from './fighters.js'
import {ATTACK_PLATFORMS, BOMBER_PLATFORMS, FIGHTER_BOMBER_PLATFORMS} from './bombers.js'
import {CARGO_PLATFORMS} from './cargo.js'
import {
    AWACS_PLATFORMS,
    COMMAND_POST_PLATFORMS,
    ELECTRONIC_ATTACK_PLATFORMS,
    JAMMER_PLATFORMS,
    PASSENGER_PLATFORMS,
    PATROL_PLATFORMS,
    PHOTO_RECON_PLATFORMS,
    RECON_PLATFORMS,
    TANKER_PLATFORMS,
} from './support.js'
import {
    ASW_PLATFORMS,
    ROTARY_WING_PLATFORMS,
    UAV_PLATFORMS,
    VSTOL_PLATFORMS,
} from './rotaryAndUav.js'
import {SUBMARINE_PLATFORMS, SURFACE_COMBATANT_PLATFORMS} from './naval.js'
import {TRAINER_PLATFORMS} from './trainers.js'

const TRACK_SPECIFIC_TYPE_OPTIONS = {
    [TRACK_TYPES.FIGHTER]: FIGHTER_PLATFORMS,
    '01:110105': FIGHTER_BOMBER_PLATFORMS,
    '01:110102': ATTACK_PLATFORMS,
    '01:110103': BOMBER_PLATFORMS,
    '01:110107': CARGO_PLATFORMS,
    [TRACK_TYPES.TANKER]: TANKER_PLATFORMS,
    [TRACK_TYPES.AWACS]: AWACS_PLATFORMS,
    '01:110110': PATROL_PLATFORMS,
    '01:110111': RECON_PLATFORMS,
    '01:110128': PHOTO_RECON_PLATFORMS,
    '01:110300': UAV_PLATFORMS,
    '01:110400': UAV_PLATFORMS,
    '01:110200': ROTARY_WING_PLATFORMS,
    '01:110131': PASSENGER_PLATFORMS,
    '01:110108': JAMMER_PLATFORMS,
    '01:110114': VSTOL_PLATFORMS,
    '01:110115': COMMAND_POST_PLATFORMS,
    '01:110117': PATROL_PLATFORMS,
    '01:110118': ASW_PLATFORMS,
    '01:110133': ELECTRONIC_ATTACK_PLATFORMS,
    '01:110112': TRAINER_PLATFORMS,
    [TRACK_TYPES.SURFACE_COMBATANT]: SURFACE_COMBATANT_PLATFORMS,
    [TRACK_TYPES.SUBMARINE]: SUBMARINE_PLATFORMS,
}

export function getSpecificTypeOptionsForTrackType(type) {
    return TRACK_SPECIFIC_TYPE_OPTIONS[type] ?? [UNSPECIFIED_OPTION]
}

export function getDefaultSpecificTypeForTrackType(type) {
    return getSpecificTypeOptionsForTrackType(type)[0]?.value ?? ''
}

export function normalizeSpecificType(specificType, type) {
    const options = getSpecificTypeOptionsForTrackType(type)
    const normalizedValue = specificType ?? ''

    if (options.some((option) => option.value === normalizedValue)) {
        return normalizedValue
    }

    return getDefaultSpecificTypeForTrackType(type)
}
