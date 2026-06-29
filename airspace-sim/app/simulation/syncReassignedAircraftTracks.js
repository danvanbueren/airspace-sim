import {getAutoDropStateClearUpdates} from './trackAutoDrop.js'

/**
 * Keep firm tracks aligned when viewport maintenance repositions truth aircraft.
 *
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {Array<{id: string, longitude: number, latitude: number, heading: number, speed: number, altitude: number}>} reassignedAircraft
 * @param {number} timestamp
 */
export function syncReassignedAircraftTracks(trackStore, reassignedAircraft, timestamp) {
    if (!trackStore || !reassignedAircraft?.length) {
        return
    }

    const reassignedById = new Map(reassignedAircraft.map((aircraft) => [aircraft.id, aircraft]))

    trackStore.getAllTracks().forEach((track) => {
        const trackId = track.trackId ?? track.id
        const aircraft = reassignedById.get(track.truthAircraftId)

        if (!trackId || !aircraft) {
            return
        }

        trackStore.updateTrack(trackId, {
            longitude: aircraft.longitude,
            latitude: aircraft.latitude,
            heading: aircraft.heading,
            speed: aircraft.speed,
            altitude: aircraft.altitude,
            lastSensorUpdateAt: timestamp,
            lastExtrapolationAt: timestamp,
            stale: false,
            correlated: true,
            ...getAutoDropStateClearUpdates(),
        })
    })
}
