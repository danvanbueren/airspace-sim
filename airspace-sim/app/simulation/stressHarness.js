import {TrackEngine} from './TrackEngine'

function createMockMap(bounds) {
    return {
        getBounds() {
            return {
                getWest: () => bounds.west,
                getSouth: () => bounds.south,
                getEast: () => bounds.east,
                getNorth: () => bounds.north,
            }
        },
    }
}

/**
 * Run a synthetic benchmark and return timing stats.
 * @param {{trackTarget?: number, ticks?: number}} options
 */
export function runSimulationStressHarness(options = {}) {
    const trackTarget = options.trackTarget ?? 500
    const ticks = options.ticks ?? 120
    const bounds = {west: -95, south: 35, east: -85, north: 45}
    const mockMap = createMockMap(bounds)

    const engine = new TrackEngine({
        settings: {
            simulationEnabled: true,
            maxActiveFlights: trackTarget,
            radarRefreshMs: 100,
            iffRefreshMs: 50,
            trackUpdateHz: 20,
            correlationThresholdNm: 5,
            adaptivePerformanceEnabled: true,
            qualityPreset: 'balanced',
            viewportPaddingDegrees: 0.5,
        },
    })

    const tickDurations = []
    let timestamp = Date.now()

    for (let index = 0; index < ticks; index += 1) {
        const start = performance.now()
        timestamp += 50
        engine.tick({map: mockMap, timestamp})
        tickDurations.push(performance.now() - start)
    }

    const snapshot = engine.getSnapshot()
    const sorted = [...tickDurations].sort((a, b) => a - b)
    const total = tickDurations.reduce((sum, value) => sum + value, 0)

    engine.dispose()

    return {
        trackTarget,
        ticks,
        trackCount: snapshot.tracks.length,
        avgTickMs: total / tickDurations.length,
        p95TickMs: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        maxTickMs: sorted[sorted.length - 1] ?? 0,
        perf: snapshot.perf,
    }
}
