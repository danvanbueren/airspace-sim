/**
 * Extended validation with realistic firm-track buildup.
 */
import {TrackEngine} from '../app/simulation/TrackEngine.js'
import {FlightWorldSimulator} from '../app/simulation/FlightWorldSimulator.js'
import {TrackStore} from '../app/simulation/TrackStore.js'
import {SensorSimulator} from '../app/simulation/SensorSimulator.js'
import {correlateDetections} from '../app/simulation/correlation.js'
import {syncActiveTrackKinematicsFromFlightWorld} from '../app/simulation/syncActiveTrackKinematicsFromFlightWorld.js'
import {enrichTracksWithAttentionFlags} from '../app/simulation/trackAttentionFlags.js'
import {SENSOR_TYPES} from '../app/simulation/constants.js'

function bench(fn, iterations = 40) {
    const times = []
    for (let i = 0; i < iterations; i += 1) fn() || times.push(performance.now())
    for (let i = 0; i < iterations; i += 1) {
        const s = performance.now()
        fn()
        times.push(performance.now() - s)
    }
    times.sort((a, b) => a - b)
    return {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        p95: times[Math.floor(times.length * 0.95)],
    }
}

function createMockMap(bounds) {
    return {
        getBounds: () => ({
            getWest: () => bounds.west,
            getSouth: () => bounds.south,
            getEast: () => bounds.east,
            getNorth: () => bounds.north,
        }),
    }
}

const wideBounds = {west: -130, south: 24, east: -65, north: 50}
const narrowBounds = {west: -95, south: 35, east: -85, north: 45}

function warmupEngine(fleet, bounds, ticks = 600) {
    const engine = new TrackEngine({
        settings: {
            simulationEnabled: true,
            maxActiveFlights: fleet,
            radarRefreshMs: 4000,
            iffRefreshMs: 1000,
            trackUpdateHz: 10,
            adaptivePerformanceEnabled: false,
            qualityPreset: 'global_dense',
            viewportPaddingDegrees: 2,
        },
    })
    const mockMap = createMockMap(bounds)
    let ts = Date.now()
    for (let i = 0; i < ticks; i += 1) {
        ts += 100
        engine.tick({map: mockMap, timestamp: ts})
    }
    return {engine, mockMap, ts}
}

console.log('=== EXTENDED: Realistic firm-track state ===')
const {engine, mockMap, ts: startTs} = warmupEngine(1200, wideBounds, 800)
const snap = engine.getSnapshot()
console.log(JSON.stringify({
    firmTracks: snap.tracks.length,
    radarCurrent: snap.radar.current.length,
    iffCurrent: snap.iff.current.length,
}))

const world = engine.flightWorld
const store = engine.trackStore
const sensor = new SensorSimulator()
const aircraft = world.getAircraftInBounds(wideBounds)
const detections = sensor.scan({aircraftInBounds: aircraft, timestamp: Date.now(), sensorType: SENSOR_TYPES.RADAR})
const activeTracks = store.getAllTracks().filter((t) => t.correlationMode === 'active')

console.log('\n=== Phase breakdown at steady state ===')
console.log(JSON.stringify({
    aircraftInBounds: aircraft.length,
    detectionsPerScan: detections.length,
    activeTracks: activeTracks.length,
    advanceMs: bench(() => world.advance(0.1)).avg,
    extrapolateMs: bench(() => store.extrapolate(Date.now(), 0.1, {})).avg,
    syncKinematicsMs: bench(() => syncActiveTrackKinematicsFromFlightWorld(world, store, Date.now())).avg,
    enrichSnapshotMs: bench(() => enrichTracksWithAttentionFlags(store.getAllTracks(), Date.now(), 1000)).avg,
    correlateMs: bench(() => correlateDetections(detections, activeTracks, 5)).avg,
}, null, 2))

console.log('\n=== Tick timing: normal vs IFF scan vs radar scan ===')
let ts = startTs
const normal = []
const iff = []
const radar = []
for (let i = 0; i < 120; i += 1) {
    ts += 100
    const dueIff = ts - engine.lastIffScanAt >= 1000
    const dueRadar = ts - engine.lastRadarScanAt >= 4000
    const s = performance.now()
    engine.tick({map: mockMap, timestamp: ts})
    const ms = performance.now() - s
    if (dueIff) iff.push(ms)
    else if (dueRadar) radar.push(ms)
    else normal.push(ms)
}
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
console.log(JSON.stringify({
    normalAvgMs: avg(normal),
    normalP95Ms: normal.sort((a, b) => a - b)[Math.floor(normal.length * 0.95)],
    iffScanAvgMs: avg(iff),
    iffScanP95Ms: iff.sort((a, b) => a - b)[Math.floor(iff.length * 0.95)],
    radarScanAvgMs: avg(radar),
    radarScanP95Ms: radar.sort((a, b) => a - b)[Math.floor(radar.length * 0.95)],
    iffSamples: iff.length,
    radarSamples: radar.length,
}, null, 2))

console.log('\n=== Narrow vs wide viewport (same fleet, after warmup) ===')
engine.dispose()
for (const [label, bounds] of [['narrow', narrowBounds], ['wide', wideBounds]]) {
    const ctx = warmupEngine(1200, bounds, 400)
    const times = []
    let t = ctx.ts
    for (let i = 0; i < 60; i += 1) {
        t += 100
        const s = performance.now()
        ctx.engine.tick({map: ctx.mockMap, timestamp: t})
        times.push(performance.now() - s)
    }
    times.sort((a, b) => a - b)
    const s = ctx.engine.getSnapshot()
    console.log(JSON.stringify({
        label,
        firmTracks: s.tracks.length,
        avgTickMs: times.reduce((a, b) => a + b, 0) / times.length,
        p95TickMs: times[Math.floor(times.length * 0.95)],
    }))
    ctx.engine.dispose()
}

console.log('\n=== syncKinematics with REAL firm track counts ===')
for (const firmCount of [50, 150, 300, 400]) {
    const w = new FlightWorldSimulator()
    w.initialize(1200)
    const st = new TrackStore()
    for (let i = 0; i < firmCount; i += 1) {
        st.addTrack({
            id: `T-${i}`,
            trackId: `T-${i}`,
            longitude: -90 + (i % 20) * 0.5,
            latitude: 35 + (i % 15) * 0.5,
            correlationMode: 'active',
            correlated: true,
            source: 'auto',
            heading: 90,
            speed: 400,
        })
    }
    const r = bench(() => syncActiveTrackKinematicsFromFlightWorld(w, st, Date.now()), 30)
    console.log(JSON.stringify({firmTracks: firmCount, fleet: 1200, syncKinematicsAvgMs: r.avg.toFixed(3), p95Ms: r.p95.toFixed(3)}))
    w.dispose()
}
