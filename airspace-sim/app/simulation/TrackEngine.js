import {SENSOR_TYPES} from './constants'
import {SensorHistoryBuffer} from './SensorHistoryBuffer'
import {HistoryPlaybackController} from './HistoryPlaybackController'
import {PerfBudgetController} from './PerfBudgetController'
import {expandBounds} from './geo'
import {FlightWorldSimulator} from './FlightWorldSimulator'
import {SensorSimulator, createSensorSimulator} from './SensorSimulator'
import {TrackInitiationService} from './TrackInitiationService'
import {CorrelationService, createCorrelationService} from './CorrelationService'
import {TrackStore} from './TrackStore'
import {trackFromManualInput} from './trackFromDetection'
import {mergeTracksFromCorrelatedDetections} from './trackMerge'
import {getBoundedTrackDeltaSeconds} from './trackTiming'
import {syncActiveTrackKinematicsFromFlightWorld} from './syncActiveTrackKinematicsFromFlightWorld'
import {isCorrelationHoldActive} from './correlationHold'
import {enrichTracksWithAttentionFlags} from './trackAttentionFlags'
import {
    getAutoDropStateClearUpdates,
    processAutoDropTracks,
    shouldShowDropAttention,
} from './trackAutoDrop'
import {
    decorrelateAllActiveTracks,
    refreshTrackStaleAndDecorrelation,
} from './trackDecorrelation'
import {processTrackIdentityPromotion} from './trackIdentityPromotion.js'

export class TrackEngine {
    constructor(options = {}) {
        this.flightWorld = options.flightWorld ?? new FlightWorldSimulator()
        this.sensorSimulator = options.sensorSimulator ?? createSensorSimulator()
        this.trackInitiation = options.trackInitiation ?? new TrackInitiationService({
            flightWorld: this.flightWorld,
        })
        this.correlation = options.correlation ?? createCorrelationService()
        this.trackStore = options.trackStore ?? new TrackStore()
        this.settings = options.settings ?? {}
        this.historyBuffers = {
            [SENSOR_TYPES.RADAR]: new SensorHistoryBuffer(),
            [SENSOR_TYPES.IFF]: new SensorHistoryBuffer(),
        }
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
        this.mapOverlayVisibility = {
            airports: true,
            airRoutes: true,
        }
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
        const simulationReenabled = (
            previousSettings.simulationEnabled === false
            && nextSettings.simulationEnabled !== false
        )
        const simulationDisabled = (
            previousSettings.simulationEnabled !== false
            && nextSettings.simulationEnabled === false
        )
        const shouldResetScanTimers = (
            previousSettings.radarRefreshMs !== nextSettings.radarRefreshMs
            || previousSettings.iffRefreshMs !== nextSettings.iffRefreshMs
            || previousSettings.correlationThresholdNm !== nextSettings.correlationThresholdNm
            || simulationReenabled
        )

        if (shouldResetScanTimers) {
            this.lastRadarScanAt = 0
            this.lastIffScanAt = 0
        }

        if (simulationReenabled) {
            this.lastTrackTickAt = 0
        }

        if (simulationDisabled) {
            decorrelateAllActiveTracks(this.trackStore, Date.now())
        }

        const previousMaxFlights = this.getMaxActiveFlights(previousSettings)
        const nextMaxFlights = this.getMaxActiveFlights(nextSettings)

        if (previousMaxFlights !== nextMaxFlights) {
            this.flightWorld.setMaxActiveFlights(nextMaxFlights)
        }

        this.trackInitiation.plotAssociationThresholdNm = (
            nextSettings.plotAssociationThresholdNm ?? 3
        )

        this.notifyListeners()
    }

    getMaxActiveFlights(settings = this.settings) {
        const baseMax = settings.maxActiveFlights
            ?? settings.maxTruthAircraftInViewport
            ?? 1200

        return this.perf.getEffectiveMaxAircraft(
            baseMax,
            settings.qualityPreset ?? 'balanced',
        )
    }

    setDisplayToggles(toggles) {
        this.activeDisplayToggles = toggles
        this.mapOverlayVisibility = {
            airports: toggles.includes('AIRPORTS'),
            airRoutes: toggles.includes('AIR_ROUTES'),
        }
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
        this.trackStore.upsertManualTrack(trackFromManualInput(track))
        this.notifyListeners()
    }

    getTrack(trackId) {
        return this.trackStore.getTrack(trackId)
    }

    removeManualTrack(trackId) {
        this.trackStore.removeTrack(trackId)
        this.notifyListeners()
    }

    dropTrack(trackId) {
        this.trackStore.dropTrack(trackId)
        this.notifyListeners()
    }

    recoverTrack(trackId) {
        const track = this.trackStore.getTrack(trackId)

        if (!track || !shouldShowDropAttention(track)) {
            return
        }

        this.trackStore.updateTrack(trackId, getAutoDropStateClearUpdates())
        this.notifyListeners()
    }

    setDropProtect(trackId, enabled) {
        const track = this.trackStore.getTrack(trackId)

        if (!track) {
            return
        }

        const updates = {
            dropProtect: Boolean(enabled),
        }

        if (enabled) {
            Object.assign(updates, getAutoDropStateClearUpdates())
        }

        this.trackStore.updateTrack(trackId, updates)
        this.notifyListeners()
    }

    setTrackCorrelationMode(trackId, mode) {
        this.trackStore.setCorrelationMode(trackId, mode)
        this.notifyListeners()
    }

    updateTrack(track) {
        const id = track.trackId ?? track.id

        if (!id) {
            return
        }

        const userUpdates = {
            ...track,
            userDirected: true,
            lastUserEditAt: Date.now(),
        }

        if (this.trackStore.isManual(id)) {
            this.trackStore.upsertManualTrack(userUpdates)
        } else {
            this.trackStore.updateTrack(id, userUpdates)

            if (track.correlationMode) {
                this.trackStore.setCorrelationMode(id, track.correlationMode)
            }
        }

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

    applyCorrelatedKinematics(correlatedDetections, timestamp = Date.now()) {
        correlatedDetections.forEach((detection) => {
            if (!detection.correlated || !detection.correlatedTrackId) {
                return
            }

            const existing = this.trackStore.getTrack(detection.correlatedTrackId)

            if (isCorrelationHoldActive(existing, timestamp)) {
                this.trackStore.updateTrack(detection.correlatedTrackId, {
                    correlated: true,
                })
                return
            }

            const nearest = this.flightWorld.findNearestAircraft(
                detection.longitude,
                detection.latitude,
            )

            const updates = {
                correlated: true,
            }

            if (nearest) {
                updates.heading = Math.round(nearest.heading ?? 0)
                updates.speed = Math.round(nearest.speed ?? 0)
                updates.altitude = Math.round(nearest.altitude ?? 0)
            }

            this.trackStore.updateTrack(detection.correlatedTrackId, updates)
        })
    }

    runSensorScan(sensorType, timestamp, bounds) {
        this.trackInitiation.plotAssociationThresholdNm = (
            this.settings.plotAssociationThresholdNm ?? 3
        )

        const aircraftInBounds = this.flightWorld.getAircraftInBounds(bounds)
        const rawDetections = this.sensorSimulator.scan({
            aircraftInBounds,
            timestamp,
            sensorType,
        })

        const proximityNm = this.settings.plotAssociationThresholdNm ?? 3
        const correlationNm = this.settings.correlationThresholdNm ?? 5

        const correlatedDetections = this.correlation.apply(
            rawDetections,
            this.trackStore,
            correlationNm,
            timestamp,
            sensorType,
        )

        this.applyCorrelatedKinematics(correlatedDetections, timestamp)

        mergeTracksFromCorrelatedDetections(
            this.trackStore,
            correlatedDetections,
            proximityNm,
            timestamp,
        )

        this.trackInitiation.absorbPlotsNearCorrelatedDetections(
            correlatedDetections,
            proximityNm,
        )

        const uncorrelatedDetections = correlatedDetections.filter(
            (detection) => !detection.correlated,
        )

        this.trackInitiation.ingest(
            sensorType,
            uncorrelatedDetections,
            timestamp,
            this.trackStore,
            {proximityNm},
        )

        this.historyBuffers[sensorType].push({
            sensorType,
            receivedAt: timestamp,
            detections: correlatedDetections,
        })

        this.playbackController.stop(sensorType)
        this.playbackController.sync(
            sensorType,
            this.historyBuffers[sensorType],
            this.activeDisplayToggles,
        )
    }

    hasTracks() {
        return this.trackStore.getAllTracks().length > 0
    }

    runMaintenanceTick(timestamp = Date.now()) {
        refreshTrackStaleAndDecorrelation(this.trackStore, timestamp, this.settings)
        processTrackIdentityPromotion(this.trackStore, timestamp)
        processAutoDropTracks(this.trackStore, timestamp)
        this.lastTrackTickAt = timestamp
    }

    tick({map, timestamp = Date.now()}) {
        const bounds = expandBounds(
            this.getMapBounds(map),
            this.settings.viewportPaddingDegrees ?? 0.5,
        )
        const simulationEnabled = this.settings.simulationEnabled !== false
        const hasTracks = this.hasTracks()

        if (!simulationEnabled) {
            if (!hasTracks) {
                return this.getSnapshot()
            }

            this.runMaintenanceTick(timestamp)
            this.notifyListeners()

            return this.getSnapshot()
        }

        if (!bounds) {
            return this.getSnapshot()
        }

        const maxFlights = this.getMaxActiveFlights()

        if (!this.flightWorld.initialized) {
            this.flightWorld.initialize(maxFlights)
        } else {
            this.flightWorld.setMaxActiveFlights(maxFlights)
        }

        const deltaSeconds = getBoundedTrackDeltaSeconds(timestamp, this.lastTrackTickAt)

        if (deltaSeconds > 0 && !this.perf.shouldSkipSimulationStep()) {
            this.flightWorld.advance(deltaSeconds)
            this.trackStore.extrapolate(timestamp, deltaSeconds, this.settings)
            syncActiveTrackKinematicsFromFlightWorld(this.flightWorld, this.trackStore, timestamp)
        }

        this.lastTrackTickAt = timestamp

        if (!this.hasRunInitialScans) {
            this.hasRunInitialScans = true
            this.forceSensorScans(timestamp, bounds)
        }

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

        refreshTrackStaleAndDecorrelation(this.trackStore, timestamp, this.settings)
        processTrackIdentityPromotion(this.trackStore, timestamp)
        processAutoDropTracks(this.trackStore, timestamp)

        this.notifyListeners()

        return this.getSnapshot()
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
        const evaluationTime = this.lastTrackTickAt || Date.now()

        return {
            evaluationTime,
            tracks: enrichTracksWithAttentionFlags(
                this.trackStore.getAllTracks(),
                evaluationTime,
                this.settings.iffRefreshMs ?? 1000,
            ),
            radar: this.getDisplayDetections(SENSOR_TYPES.RADAR),
            iff: this.getDisplayDetections(SENSOR_TYPES.IFF),
            perf: this.perf.getStats(),
            airports: this.flightWorld.getAirports(),
            airRoutes: this.flightWorld.getRoutes(),
            mapOverlayVisibility: this.mapOverlayVisibility,
        }
    }

    getSimulationTimestamp() {
        return this.lastTrackTickAt || Date.now()
    }

    dispose() {
        this.playbackController.dispose()
        this.flightWorld.dispose?.()
        this.trackInitiation.clear()
        this.listeners.clear()
    }
}
