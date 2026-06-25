export const SENSOR_TYPES = {
    RADAR: 'radar',
    IFF: 'iff',
}

export const SENSOR_DISPLAY_TOGGLES = {
    IFF_CURRENT: 'IFF_CURRENT',
    IFF_HISTORY: 'IFF_HISTORY',
    RADAR_CURRENT: 'RADAR_CURRENT',
    RADAR_HISTORY: 'RADAR_HISTORY',
    AIRPORTS: 'AIRPORTS',
    AIR_ROUTES: 'AIR_ROUTES',
}

export const SENSOR_HISTORY_CYCLE_COUNT = 6

export const HISTORY_PLAYBACK_STEP_MS = 200
export const HISTORY_PLAYBACK_NEWEST_DWELL_MS = 3000

export const TRACK_INITIATION_HIT_COUNT = 3

export const SENSOR_COLORS = {
    [SENSOR_TYPES.RADAR]: '#ffb300',
    [SENSOR_TYPES.IFF]: '#4caf50',
}

export const DEFAULT_SIMULATION_SETTINGS = {
    radarRefreshMs: 4000,
    iffRefreshMs: 1000,
    trackUpdateHz: 10,
    correlationThresholdNm: 5,
    plotAssociationThresholdNm: 3,
    qualityPreset: 'balanced',
    adaptivePerformanceEnabled: true,
    simulationEnabled: true,
    maxActiveFlights: 800,
    viewportPaddingDegrees: 0.5,
}

export const QUALITY_PRESET_CUSTOM = 'custom'

export const SELECTABLE_QUALITY_PRESET_OPTIONS = ['low', 'balanced', 'high', 'global_dense']

export const QUALITY_PRESET_TUNING_KEYS = ['trackUpdateHz', 'maxActiveFlights']

export const QUALITY_PRESETS = {
    low: {
        trackUpdateHz: 5,
        maxActiveFlights: 400,
    },
    balanced: {
        trackUpdateHz: 10,
        maxActiveFlights: 800,
    },
    high: {
        trackUpdateHz: 12,
        maxActiveFlights: 1000,
    },
    global_dense: {
        trackUpdateHz: 10,
        maxActiveFlights: 1500,
    },
}

export const QUALITY_PRESET_LABELS = {
    low: 'Low',
    balanced: 'Balanced',
    high: 'High',
    global_dense: 'Ultra',
    [QUALITY_PRESET_CUSTOM]: 'Custom',
}

export function qualityPresetMatchesSettings(preset, {trackUpdateHz, maxActiveFlights}) {
    const definition = QUALITY_PRESETS[preset]

    if (!definition) {
        return false
    }

    return definition.trackUpdateHz === trackUpdateHz
        && definition.maxActiveFlights === maxActiveFlights
}

export function resolveQualityPresetAfterManualTuning(currentSettings, updates) {
    const nextSettings = {
        ...currentSettings,
        ...updates,
    }
    const currentPreset = currentSettings.qualityPreset
    const revertPreset = SELECTABLE_QUALITY_PRESET_OPTIONS.includes(
        currentSettings.qualityPresetBeforeCustom,
    )
        ? currentSettings.qualityPresetBeforeCustom
        : undefined

    if (currentPreset === QUALITY_PRESET_CUSTOM) {
        if (revertPreset && qualityPresetMatchesSettings(revertPreset, nextSettings)) {
            return {
                qualityPreset: revertPreset,
                qualityPresetBeforeCustom: undefined,
            }
        }

        return {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            qualityPresetBeforeCustom: revertPreset,
        }
    }

    if (
        SELECTABLE_QUALITY_PRESET_OPTIONS.includes(currentPreset)
        && qualityPresetMatchesSettings(currentPreset, nextSettings)
    ) {
        return {
            qualityPreset: currentPreset,
            qualityPresetBeforeCustom: undefined,
        }
    }

    return {
        qualityPreset: QUALITY_PRESET_CUSTOM,
        qualityPresetBeforeCustom: currentPreset,
    }
}
