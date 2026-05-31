export const SENSOR_TYPES = {
    RADAR: 'radar',
    IFF: 'iff',
}

export const SENSOR_DISPLAY_TOGGLES = {
    IFF_CURRENT: 'IFF_CURRENT',
    IFF_HISTORY: 'IFF_HISTORY',
    RADAR_CURRENT: 'RADAR_CURRENT',
    RADAR_HISTORY: 'RADAR_HISTORY',
}

export const SENSOR_HISTORY_CYCLE_COUNT = 6

export const HISTORY_PLAYBACK_STEP_MS = 200
export const HISTORY_PLAYBACK_NEWEST_DWELL_MS = 3000

export const SENSOR_COLORS = {
    [SENSOR_TYPES.RADAR]: '#ffb300',
    [SENSOR_TYPES.IFF]: '#4caf50',
}

export const DEFAULT_SIMULATION_SETTINGS = {
    radarRefreshMs: 4000,
    iffRefreshMs: 1000,
    trackUpdateHz: 10,
    correlationThresholdNm: 5,
    qualityPreset: 'balanced',
    adaptivePerformanceEnabled: true,
    simulationEnabled: true,
    maxTruthAircraftInViewport: 200,
    viewportPaddingDegrees: 0.5,
}

export const QUALITY_PRESETS = {
    low: {
        trackUpdateHz: 5,
        maxTruthAircraftInViewport: 50,
    },
    balanced: {
        trackUpdateHz: 10,
        maxTruthAircraftInViewport: 200,
    },
    high: {
        trackUpdateHz: 15,
        maxTruthAircraftInViewport: 500,
    },
}
