export const PERFORMANCE_HISTORY_BUCKET_MS = 1000
export const PERFORMANCE_HISTORY_LENGTH = 15
export const PERFORMANCE_TARGET_FRAME_MS = 16.67
export const PERFORMANCE_MAX_MARKER_COLOR = '#ef5350'
export const PERFORMANCE_BUDGET_LINE_COLOR = '#ffeb3b'
export const PERFORMANCE_Y_AXIS_MIN_MS = 20

export const PERFORMANCE_FRAME_SEGMENTS = [
    {
        key: 'simTickMs',
        label: 'Simulation tick',
        color: '#4fc3f7',
    },
    {
        key: 'trackSymbolsSetDataMs',
        label: 'Track symbols',
        color: '#ffb74d',
    },
    {
        key: 'trackVectorsSetDataMs',
        label: 'Velocity vectors',
        color: '#ff8a65',
    },
    {
        key: 'sensorRadarSetDataMs',
        label: 'Radar detections',
        color: '#81c784',
    },
    {
        key: 'sensorIffSetDataMs',
        label: 'IFF detections',
        color: '#66bb6a',
    },
    {
        key: 'viewportSyncMs',
        label: 'Viewport filter',
        color: '#4dd0e1',
    },
]

/** Segments drawn in the chart and legend — measured compute only (no idle frame gap). */
export const PERFORMANCE_MEASURED_FRAME_SEGMENTS = PERFORMANCE_FRAME_SEGMENTS
