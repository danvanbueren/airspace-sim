/**
 * @typedef {Object} TruthAircraftState
 * @property {string} id
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} heading
 * @property {number} speed
 * @property {number} [altitude]
 * @property {string} [profile]
 */

/**
 * @typedef {Object} SensorDetection
 * @property {string} id
 * @property {import('./constants').SENSOR_TYPES[keyof import('./constants').SENSOR_TYPES]} sensorType
 * @property {number} timestamp
 * @property {number} longitude
 * @property {number} latitude
 * @property {string|null} truthId
 * @property {string|null} correlatedTrackId
 * @property {boolean} correlated
 * @property {number} [quality]
 * @property {number|null} [correlationDistanceNm]
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
 */

export {}
