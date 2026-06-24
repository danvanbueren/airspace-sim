'use client'

import {createContext, useContext, useEffect, useMemo, useRef} from 'react'
import {TrackEngine} from '@/app/simulation/TrackEngine'
import {runSimulationStressHarness} from '@/app/simulation/stressHarness'
import {useAppSettings} from './AppSettingsContext'
import {useSensorDisplay} from './SensorDisplayContext'

const SimulationContext = createContext(null)

export function SimulationProvider({children}) {
    const {simulationSettings} = useAppSettings()
    const {activeToggles} = useSensorDisplay()
    const engineRef = useRef(null)

    if (!engineRef.current) {
        engineRef.current = new TrackEngine({settings: simulationSettings})
    }

    useEffect(() => {
        engineRef.current.setSettings(simulationSettings)
    }, [simulationSettings])

    useEffect(() => {
        const engine = engineRef.current

        engine.setDisplayToggles(activeToggles)

        if (activeToggles.length > 0) {
            engine.notifyListeners()
        }
    }, [activeToggles])

    useEffect(() => () => {
        engineRef.current?.dispose()
    }, [])

    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            window.__airspaceSimStressHarness = runSimulationStressHarness
        }
    }, [])

    const value = useMemo(() => ({
        getEngine: () => engineRef.current,
        getTrack: (trackId) => engineRef.current?.getTrack(trackId) ?? null,
        upsertManualTrack: (track) => engineRef.current?.upsertManualTrack(track),
        removeManualTrack: (trackId) => engineRef.current?.removeManualTrack(trackId),
        dropTrack: (trackId) => engineRef.current?.dropTrack(trackId),
        setTrackCorrelationMode: (trackId, mode) => (
            engineRef.current?.setTrackCorrelationMode(trackId, mode)
        ),
        updateTrack: (track) => engineRef.current?.updateTrack(track),
    }), [])

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    )
}

export function useSimulation() {
    const context = useContext(SimulationContext)

    if (!context) {
        throw new Error('useSimulation must be used inside SimulationProvider')
    }

    return context
}
