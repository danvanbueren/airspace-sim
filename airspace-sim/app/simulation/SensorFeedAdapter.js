/**
 * @typedef {Object} SensorFeedSnapshot
 * @property {import('./constants').SENSOR_TYPES[keyof import('./constants').SENSOR_TYPES]} sensorType
 * @property {number} timestamp
 * @property {import('./types').SensorDetection[]} detections
 */

/**
 * @typedef {Object} SensorFeedAdapter
 * @property {(options: {bounds: import('./geo').Bounds|null, timestamp: number}) => SensorFeedSnapshot[]} scan
 * @property {() => void} [dispose]
 */

export function createNoOpFeedAdapter() {
    return {
        scan() {
            return []
        },
    }
}
