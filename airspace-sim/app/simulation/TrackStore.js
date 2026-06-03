import {extrapolatePosition} from './geo'
import {TRACK_CORRELATION_MODES} from './trackFromDetection'
import {buildMergedTrackState} from './trackMerge'

export class TrackStore {
    constructor() {
        this.tracks = new Map()
        this.manualTrackIds = new Set()
        this.droppedAutoTrackIds = new Set()
    }

    has(trackId) {
        return this.tracks.has(trackId)
    }

    getTrack(trackId) {
        return this.tracks.get(trackId) ?? null
    }

    getAllTracks() {
        return Array.from(this.tracks.values())
    }

    addTrack(track) {
        const id = track.trackId ?? track.id

        if (!id || this.droppedAutoTrackIds.has(id)) {
            return
        }

        this.tracks.set(id, {
            ...track,
            id,
            trackId: id,
        })
    }

    updateTrack(trackId, updates) {
        const existing = this.tracks.get(trackId)

        if (!existing) {
            return
        }

        const next = {
            ...existing,
            ...updates,
            id: trackId,
            trackId,
        }

        if (updates.userDirected) {
            next.lastUserEditAt = updates.lastUserEditAt ?? Date.now()
        }

        this.tracks.set(trackId, next)
    }

    upsertManualTrack(track) {
        const id = track.trackId ?? track.id

        if (!id) {
            return
        }

        const normalized = {
            ...track,
            id,
            trackId: id,
            source: 'manual',
            userDirected: true,
            lastUserEditAt: track.lastUserEditAt ?? Date.now(),
            correlationMode: track.correlationMode ?? TRACK_CORRELATION_MODES.ACTIVE,
            lastExtrapolationAt: track.lastExtrapolationAt ?? Date.now(),
            lastSensorUpdateAt: track.lastSensorUpdateAt ?? Date.now(),
            stale: false,
        }

        this.manualTrackIds.add(id)
        this.droppedAutoTrackIds.delete(id)
        this.tracks.set(id, normalized)
    }

    removeTrack(trackId) {
        const track = this.tracks.get(trackId)

        this.tracks.delete(trackId)
        this.manualTrackIds.delete(trackId)

        if (track?.source === 'auto') {
            this.droppedAutoTrackIds.add(trackId)
        }
    }

    dropTrack(trackId) {
        this.removeTrack(trackId)
    }

    setCorrelationMode(trackId, mode) {
        const existing = this.tracks.get(trackId)

        if (!existing) {
            return
        }

        const updates = {
            correlationMode: mode,
        }

        if (mode === TRACK_CORRELATION_MODES.SUSPEND) {
            updates.speed = 0
        }

        this.updateTrack(trackId, updates)

        if (this.manualTrackIds.has(trackId)) {
            const manual = this.tracks.get(trackId)
            this.tracks.set(trackId, manual)
        }
    }

    extrapolate(timestamp, deltaSeconds, settings) {
        if (deltaSeconds <= 0) {
            return
        }

        const staleThresholdMs = Math.max(
            (settings.radarRefreshMs ?? 4000) * 2,
            (settings.iffRefreshMs ?? 1000) * 4,
        )

        this.tracks.forEach((track, id) => {
            if (track.correlationMode === TRACK_CORRELATION_MODES.SUSPEND) {
                this.tracks.set(id, {
                    ...track,
                    speed: 0,
                    lastExtrapolationAt: timestamp,
                })
                return
            }

            if (track.correlationMode === TRACK_CORRELATION_MODES.EXTRAPOLATED
                || !Number.isFinite(track.speed)
                || track.speed <= 0) {
                if (track.correlationMode === TRACK_CORRELATION_MODES.EXTRAPOLATED
                    && Number.isFinite(track.speed)
                    && track.speed > 0) {
                    const position = extrapolatePosition(
                        track.longitude,
                        track.latitude,
                        track.heading ?? 0,
                        track.speed,
                        deltaSeconds,
                    )

                    this.tracks.set(id, {
                        ...track,
                        longitude: position.lng,
                        latitude: position.lat,
                        lastExtrapolationAt: timestamp,
                        stale: timestamp - (track.lastSensorUpdateAt ?? timestamp) > staleThresholdMs,
                    })
                }

                return
            }

            const position = extrapolatePosition(
                track.longitude,
                track.latitude,
                track.heading ?? 0,
                track.speed,
                deltaSeconds,
            )

            this.tracks.set(id, {
                ...track,
                longitude: position.lng,
                latitude: position.lat,
                lastExtrapolationAt: timestamp,
                stale: timestamp - (track.lastSensorUpdateAt ?? timestamp) > staleThresholdMs,
            })
        })
    }

    isManual(trackId) {
        return this.manualTrackIds.has(trackId)
    }

    mergeTracks(survivorId, mergedId, timestamp) {
        const survivor = this.tracks.get(survivorId)
        const merged = this.tracks.get(mergedId)

        if (!survivor || !merged || survivorId === mergedId) {
            return
        }

        const mergedState = buildMergedTrackState(survivor, merged, timestamp)

        if (this.manualTrackIds.has(mergedId)) {
            this.manualTrackIds.delete(mergedId)
            this.manualTrackIds.add(survivorId)
            mergedState.source = 'manual'
        }

        this.tracks.set(survivorId, mergedState)

        this.tracks.delete(mergedId)
        this.manualTrackIds.delete(mergedId)

        if (merged.source === 'auto') {
            this.droppedAutoTrackIds.add(mergedId)
        }
    }
}
