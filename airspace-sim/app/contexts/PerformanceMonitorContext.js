'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {createPerformanceMonitor} from '@/app/simulation/PerformanceMonitor'

const PerformanceMonitorContext = createContext(null)

const DISPLAY_REFRESH_MS = 250

export function PerformanceMonitorProvider({children}) {
    const {appSettings} = useAppSettings()
    const monitorRef = useRef(null)

    if (!monitorRef.current) {
        monitorRef.current = createPerformanceMonitor()
    }

    const enabled = Boolean(appSettings.showPerformanceOverlay)

    useEffect(() => {
        monitorRef.current.setEnabled(enabled)
    }, [enabled])

    useEffect(() => {
        if (!enabled) {
            return undefined
        }

        let frameRef = null
        let lastFrameAt = performance.now()

        const loop = (timestamp) => {
            frameRef = requestAnimationFrame(loop)

            const frameMs = timestamp - lastFrameAt
            lastFrameAt = timestamp

            monitorRef.current.commitFrame(frameMs)
        }

        frameRef = requestAnimationFrame(loop)

        const resetIntervalId = window.setInterval(() => {
            monitorRef.current.resetWindow()
        }, 1000)

        return () => {
            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }

            window.clearInterval(resetIntervalId)
        }
    }, [enabled])

    const getMonitor = useCallback(() => monitorRef.current, [])

    const value = useMemo(() => ({
        getMonitor,
        enabled,
    }), [enabled, getMonitor])

    return (
        <PerformanceMonitorContext.Provider value={value}>
            {children}
        </PerformanceMonitorContext.Provider>
    )
}

export function usePerformanceMonitor() {
    const context = useContext(PerformanceMonitorContext)

    if (!context) {
        throw new Error('usePerformanceMonitor must be used inside PerformanceMonitorProvider')
    }

    return context
}

export function usePerformanceInstrumentation() {
    const {getMonitor, enabled} = usePerformanceMonitor()

    return useMemo(() => {
        const monitor = getMonitor()

        if (!enabled) {
            return {
                enabled: false,
                recordSimTick: () => {},
                recordTrackSetData: () => {},
                recordSensorSetData: () => {},
                recordViewportSync: () => {},
                updateFromSnapshot: () => {},
            }
        }

        return {
            enabled: true,
            recordSimTick: (durationMs) => monitor.recordSimTick(durationMs),
            recordTrackSetData: (durationMs, details) => monitor.recordTrackSetData(durationMs, details),
            recordSensorSetData: (durationMs, featureCount) => (
                monitor.recordSensorSetData(durationMs, featureCount)
            ),
            recordViewportSync: (visibleTrackCount, firmTrackCount) => (
                monitor.recordViewportSync(visibleTrackCount, firmTrackCount)
            ),
            updateFromSnapshot: (snapshot, details) => monitor.updateFromSnapshot(snapshot, details),
        }
    }, [enabled, getMonitor])
}

export function usePerformanceMetrics() {
    const {getMonitor, enabled} = usePerformanceMonitor()
    const [metrics, setMetrics] = useState(() => getMonitor().getMetrics())

    useEffect(() => {
        if (!enabled) {
            return undefined
        }

        const monitor = getMonitor()

        setMetrics(monitor.getMetrics())

        const intervalId = window.setInterval(() => {
            setMetrics(monitor.getMetrics())
        }, DISPLAY_REFRESH_MS)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [enabled, getMonitor])

    return {
        enabled,
        metrics,
    }
}
