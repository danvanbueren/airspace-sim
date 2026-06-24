/**
 * @typedef {'active'|'extrapolated'|'suspend'} TrackCorrelationMode
 */

/**
 * @typedef {Object} TruthAircraftState
 * @property {string} id
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} heading
 * @property {number} speed
 * @property {number} [altitude]
 * @property {string} [profile]
 * @property {string} [mode3Code]
 * @property {'commercial'|'generalAviation'} [trafficKind]
 */

/**
 * @typedef {Object} SensorDetection
 * @property {string} id
 * @property {import('./constants').SENSOR_TYPES[keyof import('./constants').SENSOR_TYPES]} sensorType
 * @property {number} timestamp
 * @property {number} longitude
 * @property {number} latitude
 * @property {string|null} correlatedTrackId
 * @property {boolean} correlated
 * @property {number} [quality]
 * @property {number|null} [correlationDistanceNm]
 * @property {string} [mode3Code]
 */

/**
 * @typedef {Object} SensorCycleSnapshot
 * @property {import('./constants').SENSOR_TYPES[keyof import('./constants').SENSOR_TYPES]} sensorType
 * @property {number} receivedAt
 * @property {number} cycleId
 * @property {SensorDetection[]} detections
 */

/**
 * @typedef {Object} TrackState
 * @property {string} id
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} heading
 * @property {number|null} speed
 * @property {number|null} altitude
 * @property {number} lastSensorUpdateAt
 * @property {number} lastExtrapolationAt
 * @property {boolean} stale
 * @property {string} domain
 * @property {string} identity
 * @property {string} type
 * @property {string} callsign
 * @property {'auto'|'manual'} [source]
 * @property {import('./constants').SENSOR_TYPES[keyof import('./constants').SENSOR_TYPES]} [initiatedBy]
 * @property {TrackCorrelationMode} [correlationMode]
 * @property {boolean} [correlated]
 * @property {string} [plotId]
 * @property {boolean} [userDirected]
 * @property {number} [lastUserEditAt]
 * @property {number} [lastUserKinematicEditAt]
 * @property {string[]} [lastUserKinematicEditFields]
 * @property {string[]} [lastManagementEditFields]
 * @property {string[]} [attentionFlags] Assigned attention flag IDs; merged with derived flags for display
 * @property {number} [dropRiskAt] Timestamp when invisible DROP-RISK auto-drop countdown started
 * @property {number} [dropAt] Timestamp when visible DROP attention phase started
 * @property {boolean} [dropProtect] When true, prevents automatic drop of uncorrelated tracks
 * @property {string|null} [iffMode3Code] Last correlated IFF Mode 3 code (sensor-derived)
 * @property {number|null} [iffMode3UpdatedAt] Timestamp of last IFF code correlation
 */

export {}
