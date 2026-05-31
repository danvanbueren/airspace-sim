import {correlateDetections} from './correlation'
import {extrapolatePosition} from './geo'
import {SENSOR_TYPES} from './constants'
import {SensorHistoryBuffer} from './SensorHistoryBuffer'
import {InAppSyntheticFeed} from './InAppSyntheticFeed'
import {HistoryPlaybackController} from './HistoryPlaybackController'
import {PerfBudgetController} from './PerfBudgetController'
import {expandBounds} from './geo'

function trackFromDetection(detection, truth) {
    const id = detection.correlatedTrackId ?? `TRK-${detection.truthId ?? detection.id}`

    return {
        id,
        trackId: id,
        longitude: detection.longitude,
        latitude: detection.latitude,
        heading: truth?.heading ?? 0,
        speed: truth?.speed ?? null,
        altitude: truth?.altitude ?? null,
        lastSensorUpdateAt: detection.timestamp,
        lastExtrapolationAt: detection.timestamp,
        stale: false,
        domain: truth?.domain ?? 'air',
        identity: truth?.identity ?? 'pending',
        type: truth?.type ?? '01:110104',
        callsign: truth?.id ?? id,
        correlated: detection.correlated,
    }
}

export class TrackEngine {
    constructor(options = {}) {
        this.feed = options.feed ?? new InAppSyntheticFeed()
        this.settings = options.settings ?? {}
        this.historyBuffers = {
            [SENSOR_TYPES.RADAR]: new SensorHistoryBuffer(),
            [SENSOR_TYPES.IFF]: new SensorHistoryBuffer(),
        }
        this.tracks = new Map()
        this.manualTracks = new Map()
        this.playbackController = new HistoryPlaybackController({
            onStep: (sensorType, cycleIndex) => {
                this.historyPlaybackState = this.historyPlaybackState ?? {}
                this.historyPlaybackState[sensorType] = cycleIndex
                this.notifyListeners()
            },
            onStop: (sensorType) => {
                this.historyPlaybackState = this.historyPlaybackState ?? {}
                delete this.historyPlaybackState[sensorType]
                this.notifyListeners()
            },
        })
        this.perf = new PerfBudgetController()
        this.listeners = new Set()
        this.historyPlaybackState = {}
        this.lastRadarScanAt = 0
        this.lastIffScanAt = 0
        this.lastTrackTickAt = 0
        this.activeDisplayToggles = []
        this.hasRunInitialScans = false
    }

    subscribe(listener) {
        this.listeners.add(listener)

        return () => this.listeners.delete(listener)
    }

    notifyListeners() {
        this.listeners.forEach((listener) => listener(this.getSnapshot()))
    }

    setSettings(settings) {
        const previousSettings = this.settings
        this.settings = {...this.settings, ...settings}
        this.perf.setEnabled(this.settings.adaptivePerformanceEnabled !== false)
        this.applySettingsChange(previousSettings, this.settings)
    }

    applySettingsChange(previousSettings, nextSettings) {
        const shouldResetScanTimers = (
            previousSettings.radarRefreshMs !== nextSettings.radarRefreshMs
            || previousSettings.iffRefreshMs !== nextSettings.iffRefreshMs
            || previousSettings.correlationThresholdNm !== nextSettings.correlationThresholdNm
            || (
                previousSettings.simulationEnabled === false
                && nextSettings.simulationEnabled !== false
            )
        )

        if (shouldResetScanTimers) {
            this.lastRadarScanAt = 0
            this.lastIffScanAt = 0
        }

        const previousMaxAircraft = this.perf.getEffectiveMaxAircraft(
            previousSettings.maxTruthAircraftInViewport ?? 200,
            previousSettings.qualityPreset ?? 'balanced',
        )
        const nextMaxAircraft = this.perf.getEffectiveMaxAircraft(
            nextSettings.maxTruthAircraftInViewport ?? 200,
            nextSettings.qualityPreset ?? 'balanced',
        )

        if (nextMaxAircraft < previousMaxAircraft) {
            const removedTruthIds = this.feed.trimToMax(nextMaxAircraft)
            this.removeTracksForTruthIds(removedTruthIds)
        }

        this.notifyListeners()
    }

    removeTracksForTruthIds(truthIds) {
        if (!truthIds.length) {
            return
        }

        const truthIdSet = new Set(truthIds)

        for (const [trackId, track] of this.tracks.entries()) {
            if (this.manualTracks.has(trackId)) {
                continue
            }

            const associatedTruthId = track.callsign ?? track.id

            if (truthIdSet.has(associatedTruthId)) {
                this.tracks.delete(trackId)
            }
        }
    }

    setDisplayToggles(toggles) {
        this.activeDisplayToggles = toggles
        this.playbackController.stopAll()
        this.syncPlayback()
        this.notifyListeners()
    }

    forceSensorScans(timestamp, bounds) {
        if (!bounds) {
            return
        }

        this.runSensorScan(SENSOR_TYPES.RADAR, timestamp, bounds)
        this.runSensorScan(SENSOR_TYPES.IFF, timestamp, bounds)
        this.lastRadarScanAt = timestamp
        this.lastIffScanAt = timestamp
        this.notifyListeners()
    }

    upsertManualTrack(track) {
        const id = track.trackId ?? track.id

        if (!id) {
            return
        }

        this.manualTracks.set(id, {
            ...track,
            id,
            trackId: id,
            lastExtrapolationAt: Date.now(),
            lastSensorUpdateAt: Date.now(),
            stale: false,
        })

        this.tracks.set(id, this.manualTracks.get(id))
        this.notifyListeners()
    }

    removeManualTrack(trackId) {
        this.manualTracks.delete(trackId)
        this.tracks.delete(trackId)
        this.notifyListeners()
    }

    getMapBounds(map) {
        if (!map) {
            return null
        }

        const bounds = map.getBounds()

        return {
            west: bounds.getWest(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            north: bounds.getNorth(),
        }
    }

    syncPlayback() {
        for (const sensorType of Object.values(SENSOR_TYPES)) {
            this.playbackController.sync(
                sensorType,
                this.historyBuffers[sensorType],
                this.activeDisplayToggles,
            )
        }
    }

    runSensorScan(sensorType, timestamp, bounds) {
        const rawDetections = this.feed.scan({bounds, timestamp, sensorType})
        const trackList = Array.from(this.tracks.values())
        const correlated = correlateDetections(
            rawDetections,
            trackList,
            this.settings.correlationThresholdNm ?? 5,
        )

        const truthById = new Map(this.feed.getTruthStates().map((truth) => [truth.id, truth]))

        correlated.forEach((detection) => {
            const truth = detection.truthId ? truthById.get(detection.truthId) : null

            if (detection.correlated && detection.correlatedTrackId) {
                const existing = this.tracks.get(detection.correlatedTrackId)

                this.tracks.set(detection.correlatedTrackId, {
                    ...(existing ?? trackFromDetection(detection, truth)),
                    longitude: detection.longitude,
                    latitude: detection.latitude,
                    heading: truth?.heading ?? existing?.heading ?? 0,
                    speed: truth?.speed ?? existing?.speed ?? null,
                    altitude: truth?.altitude ?? existing?.altitude ?? null,
                    lastSensorUpdateAt: timestamp,
                    lastExtrapolationAt: timestamp,
                    stale: false,
                    correlated: true,
                })
            } else if (detection.truthId) {
                const track = trackFromDetection(detection, truth)
                this.tracks.set(track.id, track)
            }
        })

        this.historyBuffers[sensorType].push({
            sensorType,
            receivedAt: timestamp,
            detections: correlated,
        })

        this.playbackController.stop(sensorType)
        this.playbackController.sync(
            sensorType,
            this.historyBuffers[sensorType],
            this.activeDisplayToggles,
        )
    }

    tick({map, timestamp = Date.now()}) {
        const bounds = expandBounds(
            this.getMapBounds(map),
            this.settings.viewportPaddingDegrees ?? 0.5,
        )

        if (!bounds || this.settings.simulationEnabled === false) {
            return this.getSnapshot()
        }

        const maxAircraft = this.perf.getEffectiveMaxAircraft(
            this.settings.maxTruthAircraftInViewport ?? 200,
            this.settings.qualityPreset ?? 'balanced',
        )

        this.feed.ensureViewportPopulation(bounds, maxAircraft)

        if (!this.hasRunInitialScans) {
            this.hasRunInitialScans = true
            this.forceSensorScans(timestamp, bounds)
        }

        const deltaSeconds = this.lastTrackTickAt
            ? (timestamp - this.lastTrackTickAt) / 1000
            : 0

        if (deltaSeconds > 0 && !this.perf.shouldSkipSimulationStep()) {
            this.feed.advanceTruth(deltaSeconds, bounds)
            this.extrapolateTracks(timestamp, deltaSeconds)
        }

        this.lastTrackTickAt = timestamp

        const radarInterval = this.settings.radarRefreshMs ?? 4000
        const iffInterval = this.settings.iffRefreshMs ?? 1000

        if (timestamp - this.lastRadarScanAt >= radarInterval) {
            this.lastRadarScanAt = timestamp
            this.runSensorScan(SENSOR_TYPES.RADAR, timestamp, bounds)
        }

        if (timestamp - this.lastIffScanAt >= iffInterval) {
            this.lastIffScanAt = timestamp
            this.runSensorScan(SENSOR_TYPES.IFF, timestamp, bounds)
        }

        this.notifyListeners()

        return this.getSnapshot()
    }

    extrapolateTracks(timestamp, deltaSeconds) {
        this.tracks.forEach((track, id) => {
            if (!Number.isFinite(track.speed) || track.speed <= 0) {
                return
            }

            const position = extrapolatePosition(
                track.longitude,
                track.latitude,
                track.heading ?? 0,
                track.speed,
                deltaSeconds,
            )

            const staleThresholdMs = Math.max(
                (this.settings.radarRefreshMs ?? 4000) * 2,
                (this.settings.iffRefreshMs ?? 1000) * 4,
            )

            const updatedTrack = {
                ...track,
                longitude: position.lng,
                latitude: position.lat,
                lastExtrapolationAt: timestamp,
                stale: timestamp - (track.lastSensorUpdateAt ?? timestamp) > staleThresholdMs,
            }

            this.tracks.set(id, updatedTrack)

            if (this.manualTracks.has(id)) {
                this.manualTracks.set(id, updatedTrack)
            }
        })
    }

    getDisplayDetections(sensorType) {
        const buffer = this.historyBuffers[sensorType]
        const showCurrent = this.playbackController.isCurrentEnabled(sensorType, this.activeDisplayToggles)
        const showHistory = this.playbackController.isHistoryEnabled(sensorType, this.activeDisplayToggles)
        const result = {
            current: [],
            history: [],
        }

        if (showCurrent) {
            result.current = buffer.getLatest()?.detections ?? []
        }

        if (showHistory) {
            const cycleIndex = this.historyPlaybackState[sensorType]

            if (cycleIndex !== undefined) {
                result.history = buffer.getCycle(cycleIndex)?.detections ?? []
            }
        }

        return result
    }

    getSnapshot() {
        return {
            tracks: Array.from(this.tracks.values()),
            radar: this.getDisplayDetections(SENSOR_TYPES.RADAR),
            iff: this.getDisplayDetections(SENSOR_TYPES.IFF),
            perf: this.perf.getStats(),
        }
    }

    dispose() {
        this.playbackController.dispose()
        this.feed.dispose?.()
        this.listeners.clear()
    }
}
