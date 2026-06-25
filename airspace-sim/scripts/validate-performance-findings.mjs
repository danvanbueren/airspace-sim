/**
 * Deep validation benchmark for performance findings.
 * Run: node --import ./scripts/register-loader.mjs --experimental-default-type=module scripts/validate-performance-findings.mjs
 */
import {TrackEngine} from '../app/simulation/TrackEngine.js'
import {FlightWorldSimulator} from '../app/simulation/FlightWorldSimulator.js'
import {TrackStore} from '../app/simulation/TrackStore.js'
import {SensorSimulator} from '../app/simulation/SensorSimulator.js'
import {correlateDetections} from '../app/simulation/correlation.js'
import {correlateIffDetections} from '../app/simulation/iffCorrelation.js'
import {syncActiveTrackKinematicsFromFlightWorld} from '../app/simulation/syncActiveTrackKinematicsFromFlightWorld.js'
import {enrichTracksWithAttentionFlags} from '../app/simulation/trackAttentionFlags.js'
import {tracksToVectorFeatureCollection} from '../app/simulation/trackVectorFeatures.js'
import {detectionsToFeatureCollection} from '../app/simulation/detectionFeatures.js'
import {filterTracksByBounds} from '../app/simulation/mapViewportUtils.js'
import {SENSOR_TYPES} from '../app/simulation/constants.js'
import {PerfBudgetController} from '../app/simulation/PerfBudgetController.js'

function bench(fn, iterations = 50) {
    const times = []
    for (let i = 0; i < iterations; i += 1) {
        const start = performance.now()
        fn()
        times.push(performance.now() - start)
    }
    times.sort((a, b) => a - b)
    const total = times.reduce((s, v) => s + v, 0)
    return {
        avg: total / times.length,
        p95: times[Math.floor(times.length * 0.95)],
        max: times[times.length - 1],
        min: times[0],
    }
}

function createMockMap(bounds, zoom = 6) {
    const project = ([lng, lat]) => ({
        x: ((lng - bounds.west) / (bounds.east - bounds.west)) * 1200,
        y: ((bounds.north - lat) / (bounds.north - bounds.south)) * 800,
    })
    const unproject = ({x, y}) => ({
        lng: bounds.west + (x / 1200) * (bounds.east - bounds.west),
        lat: bounds.north - (y / 800) * (bounds.north - bounds.south),
    })

    return {
        getBounds: () => ({
            getWest: () => bounds.west,
            getSouth: () => bounds.south,
            getEast: () => bounds.east,
            getNorth: () => bounds.north,
        }),
        getZoom: () => zoom,
        project,
        unproject,
    }
}

function makeSyntheticTracks(count, bounds) {
    const tracks = []
    for (let i = 0; i < count; i += 1) {
        const t = i / count
        tracks.push({
            id: `T-${i}`,
            trackId: `T-${i}`,
            longitude: bounds.west + (bounds.east - bounds.west) * (0.1 + 0.8 * (t % 1)),
            latitude: bounds.south + (bounds.north - bounds.south) * (0.1 + 0.8 * ((t * 7) % 1)),
            heading: (i * 37) % 360,
            speed: 200 + (i % 300),
            domain: 'air',
            identity: ['friend', 'hostile', 'neutral', 'unknown'][i % 4],
            type: ['fighter', 'cargo', 'rotary'][i % 3],
            callsign: `CS${i}`,
            correlationMode: 'active',
            correlated: true,
            source: 'auto',
        })
    }
    return tracks
}

const narrowBounds = {west: -95, south: 35, east: -85, north: 45}
const wideBounds = {west: -130, south: 24, east: -65, north: 50}
const sensor = new SensorSimulator()
const results = {}

console.log('=== VALIDATION 1: Viewport width does NOT reduce simulation physics ===')
for (const [label, bounds] of [['narrow', narrowBounds], ['wide', wideBounds]]) {
    const engine = new TrackEngine({
        settings: {
            simulationEnabled: true,
            maxActiveFlights: 1200,
            radarRefreshMs: 999999,
            iffRefreshMs: 999999,
            trackUpdateHz: 10,
            adaptivePerformanceEnabled: false,
            qualityPreset: 'global_dense',
            viewportPaddingDegrees: 0.5,
        },
    })
    const mockMap = createMockMap(bounds)
    let ts = Date.now()
    for (let i = 0; i < 200; i += 1) {
        ts += 100
        engine.tick({map: mockMap, timestamp: ts})
    }
    const times = []
    for (let i = 0; i < 80; i += 1) {
        ts += 100
        const s = performance.now()
        engine.tick({map: mockMap, timestamp: ts})
        times.push(performance.now() - s)
    }
    times.sort((a, b) => a - b)
    const snap = engine.getSnapshot()
    results[`viewport_${label}`] = {
        firmTracks: snap.tracks.length,
        avgTickMs: times.reduce((a, b) => a + b, 0) / times.length,
        p95TickMs: times[Math.floor(times.length * 0.95)],
    }
    engine.dispose()
}
console.log(JSON.stringify(results.viewport_narrow))
console.log(JSON.stringify(results.viewport_wide))

console.log('\n=== VALIDATION 2: Simulation tick phase breakdown (wide viewport, 1200 fleet) ===')
{
    const world = new FlightWorldSimulator()
    world.initialize(1200)
    const store = new TrackStore()
    const mockMap = createMockMap(wideBounds)
    const engine = new TrackEngine({
        settings: {
            simulationEnabled: true,
            maxActiveFlights: 1200,
            radarRefreshMs: 999999,
            iffRefreshMs: 999999,
            adaptivePerformanceEnabled: false,
            qualityPreset: 'global_dense',
            viewportPaddingDegrees: 2,
        },
    })
    let ts = Date.now()
    for (let i = 0; i < 250; i += 1) {
        ts += 100
        engine.tick({map: mockMap, timestamp: ts})
    }
    const snap = engine.getSnapshot()
    snap.tracks.forEach((t) => store.addTrack(t))

    const advance = bench(() => world.advance(0.1), 100)
    const extrapolate = bench(() => store.extrapolate(Date.now(), 0.1, {}), 100)
    const syncKinematics = bench(() => syncActiveTrackKinematicsFromFlightWorld(world, store, Date.now()), 50)
    const enrich = bench(() => enrichTracksWithAttentionFlags(store.getAllTracks(), Date.now(), 1000), 50)
    const aircraft = world.getAircraftInBounds(wideBounds)
    const detections = sensor.scan({aircraftInBounds: aircraft, timestamp: Date.now(), sensorType: SENSOR_TYPES.RADAR})
    const tracks = store.getAllTracks().filter((t) => t.correlationMode === 'active')
    const correlate = bench(() => correlateDetections(detections, tracks, 5), 30)
    const iffDetections = sensor.scan({aircraftInBounds: aircraft, timestamp: Date.now(), sensorType: SENSOR_TYPES.IFF})
    const iffCorrelate = bench(() => correlateIffDetections(iffDetections, tracks, 5), 30)

    results.phaseBreakdown = {
        firmTracks: store.getAllTracks().length,
        activeCorrelationTargets: tracks.length,
        aircraftInBounds: aircraft.length,
        detectionsPerScan: detections.length,
        advanceMs: advance.avg,
        extrapolateMs: extrapolate.avg,
        syncKinematicsMs: syncKinematics.avg,
        enrichSnapshotMs: enrich.avg,
        radarCorrelateMs: correlate.avg,
        iffCorrelateMs: iffCorrelate.avg,
    }
    console.log(JSON.stringify(results.phaseBreakdown, null, 2))
    engine.dispose()
    world.dispose()
}

console.log('\n=== VALIDATION 3: Correlation O(n²) scaling ===')
for (const n of [100, 200, 400, 600, 800, 1000]) {
    const tracks = makeSyntheticTracks(n, wideBounds)
    const detections = makeSyntheticTracks(n, wideBounds).map((t, i) => ({
        id: `D-${i}`,
        longitude: t.longitude + 0.02,
        latitude: t.latitude + 0.02,
    }))
    const r = bench(() => correlateDetections(detections, tracks, 5), 25)
    console.log(JSON.stringify({n, ops: n * n, avgMs: r.avg.toFixed(3), p95Ms: r.p95.toFixed(3)}))
}

console.log('\n=== VALIDATION 4: syncKinematics O(tracks × fleet) scaling ===')
for (const fleet of [400, 800, 1200]) {
    const world = new FlightWorldSimulator()
    world.initialize(fleet)
    const store = new TrackStore()
    makeSyntheticTracks(Math.min(300, fleet / 4), wideBounds).forEach((t) => store.addTrack(t))
    const r = bench(() => syncActiveTrackKinematicsFromFlightWorld(world, store, Date.now()), 40)
    console.log(JSON.stringify({
        fleet,
        firmTracks: store.getAllTracks().length,
        syncKinematicsAvgMs: r.avg.toFixed(3),
    }))
    world.dispose()
}

console.log('\n=== VALIDATION 5: Render-prep JS (no MapLibre) ===')
for (const visible of [100, 300, 600, 1000]) {
    const tracks = makeSyntheticTracks(visible, narrowBounds)
    const mockMap = createMockMap(narrowBounds)
    const detections = tracks.map((t, i) => ({
        id: `D-${i}`,
        longitude: t.longitude,
        latitude: t.latitude,
        correlated: i % 3 === 0,
    }))

    const replacePattern = bench(() => {
        const map = new Map()
        tracks.forEach((track) => map.set(track.id, {...track}))
        Array.from(map.values())
    }, 200)

    const vectors = bench(() => tracksToVectorFeatureCollection(tracks, mockMap), 100)
    const sensors = bench(() => {
        detectionsToFeatureCollection(detections, SENSOR_TYPES.RADAR, 'current', mockMap)
        detectionsToFeatureCollection(detections, SENSOR_TYPES.IFF, 'current', mockMap)
        detectionsToFeatureCollection(detections, SENSOR_TYPES.RADAR, 'history', mockMap)
        detectionsToFeatureCollection(detections, SENSOR_TYPES.IFF, 'history', mockMap)
    }, 80)
    const fc = tracksToVectorFeatureCollection(tracks, mockMap)
    const stringify = bench(() => JSON.stringify(fc), 80)

    console.log(JSON.stringify({
        visible,
        replacePatternMs: replacePattern.avg.toFixed(3),
        vectorsMs: vectors.avg.toFixed(3),
        sensors4xMs: sensors.avg.toFixed(3),
        jsonStringifyMs: stringify.avg.toFixed(3),
        jsonBytes: JSON.stringify(fc).length,
    }))
}

console.log('\n=== VALIDATION 6: Sensor scan spike (IFF every 1s vs normal tick) ===')
{
    const engine = new TrackEngine({
        settings: {
            simulationEnabled: true,
            maxActiveFlights: 1200,
            radarRefreshMs: 4000,
            iffRefreshMs: 1000,
            adaptivePerformanceEnabled: false,
            qualityPreset: 'global_dense',
            viewportPaddingDegrees: 2,
        },
    })
    const mockMap = createMockMap(wideBounds)
    let ts = Date.now()
    for (let i = 0; i < 300; i += 1) {
        ts += 100
        engine.tick({map: mockMap, timestamp: ts})
    }
    const normal = []
    const iffTick = []
    const radarTick = []
    for (let i = 0; i < 100; i += 1) {
        ts += 100
        const beforeIff = ts - engine.lastIffScanAt
        const beforeRadar = ts - engine.lastRadarScanAt
        const s = performance.now()
        engine.tick({map: mockMap, timestamp: ts})
        const ms = performance.now() - s
        if (beforeIff >= 1000) {
            iffTick.push(ms)
        } else if (beforeRadar >= 4000) {
            radarTick.push(ms)
        } else {
            normal.push(ms)
        }
    }
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    results.scanSpike = {
        normalAvgMs: avg(normal),
        iffScanAvgMs: avg(iffTick),
        radarScanAvgMs: avg(radarTick),
        iffSamples: iffTick.length,
        radarSamples: radarTick.length,
    }
    console.log(JSON.stringify(results.scanSpike, null, 2))
    engine.dispose()
}

console.log('\n=== VALIDATION 7: Fleet advance scales with maxActiveFlights (not viewport) ===')
for (const fleet of [400, 800, 1200, 1500]) {
    const world = new FlightWorldSimulator()
    world.initialize(fleet)
    const r = bench(() => world.advance(0.1), 80)
    console.log(JSON.stringify({fleet, advanceAvgMs: r.avg.toFixed(3), p95Ms: r.p95.toFixed(3)}))
    world.dispose()
}

console.log('\n=== VALIDATION 8: shouldCoalesceUpdates is never called ===')
{
    const perf = new PerfBudgetController()
    perf.setEnabled(true)
    perf.loadFactor = 0.5
    const wouldCoalesce = perf.shouldCoalesceUpdates()
    results.deadHook = {wouldCoalesceWhenLoadLow: wouldCoalesce, coalescedUpdatesStat: perf.stats.coalescedUpdates}
    console.log(JSON.stringify(results.deadHook))
}

console.log('\n=== VALIDATION 9: Pan/zoom handler count (static) ===')
console.log(JSON.stringify({
    moveZoomHandlers: [
        'MapView.syncVisibleTracks (replaceTracks + setState)',
        'useTrackMapLayer.scheduleSetData',
        'useSensorDetectionMapLayer.applySnapshotToSources (4x setData)',
        'TrackAttentionOverlay.updatePositions (setState)',
    ],
    setDataCallsPerPanFrame: '2 track + 4 sensor = 6 minimum',
    note: 'MapView effect also re-runs on simulationSnapshot change, coupling pan handlers to tick rate',
}))

console.log('\n=== SUMMARY ===')
console.log(JSON.stringify(results, null, 2))
