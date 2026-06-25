'use client'

import {useEffect, useRef, useState} from 'react'
import {useSimulation} from '@/app/contexts/SimulationContext'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {usePerformanceInstrumentation} from '@/app/contexts/PerformanceMonitorContext'

export function useSimulationLoop(mapRef, mapReady) {
    const {getEngine} = useSimulation()
    const {simulationSettings} = useAppSettings()
    const performanceInstrumentation = usePerformanceInstrumentation()
    const [snapshot, setSnapshot] = useState(null)
    const frameRef = useRef(null)
    const lastTickRef = useRef(0)
    const performanceInstrumentationRef = useRef(performanceInstrumentation)
    const simulationSettingsRef = useRef(simulationSettings)

    performanceInstrumentationRef.current = performanceInstrumentation
    simulationSettingsRef.current = simulationSettings

    const simulationEnabled = simulationSettings.simulationEnabled !== false
    const trackUpdateHz = simulationSettings.trackUpdateHz ?? 10

    useEffect(() => {
        if (!mapReady) {
            return undefined
        }

        const engine = getEngine()

        const handleSnapshot = (nextSnapshot) => {
            setSnapshot(nextSnapshot)
        }

        const unsubscribe = engine.subscribe(handleSnapshot)

        if (!simulationEnabled) {
            return () => {
                unsubscribe()
            }
        }

        lastTickRef.current = 0

        const loop = (frameTimestamp) => {
            frameRef.current = requestAnimationFrame(loop)

            const map = mapRef.current

            if (!map) {
                return
            }

            const settings = simulationSettingsRef.current
            const instrumentation = performanceInstrumentationRef.current
            const frameStart = performance.now()
            const trackHz = engine.perf.getEffectiveTrackUpdateHz(
                settings.trackUpdateHz ?? 10,
            )
            const minIntervalMs = 1000 / trackHz

            if (frameTimestamp - lastTickRef.current < minIntervalMs) {
                return
            }

            lastTickRef.current = frameTimestamp

            const tickStart = performance.now()

            engine.tick({
                map,
                timestamp: Date.now(),
            })

            instrumentation.recordSimTick(performance.now() - tickStart)

            const nextSnapshot = engine.getSnapshot()
            const effectiveTrackUpdateHz = engine.perf.getEffectiveTrackUpdateHz(
                settings.trackUpdateHz ?? 10,
            )

            instrumentation.updateFromSnapshot(nextSnapshot, {
                maxActiveFlights: settings.maxActiveFlights,
                effectiveTrackUpdateHz,
                mapZoom: map.getZoom?.(),
            })

            engine.perf.recordFrame(performance.now() - frameStart)
        }

        frameRef.current = requestAnimationFrame(loop)

        return () => {
            unsubscribe()

            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [getEngine, mapReady, mapRef, simulationEnabled, trackUpdateHz])

    return snapshot
}
