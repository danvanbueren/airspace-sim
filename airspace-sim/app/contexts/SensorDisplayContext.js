'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {SENSOR_DISPLAY_TOGGLES} from '@/app/simulation/constants'

const SensorDisplayContext = createContext(null)

export function SensorDisplayProvider({children}) {
    const [activeToggles, setActiveToggles] = useState(['IFF_CURRENT', 'IFF_HISTORY', 'RADAR_CURRENT', 'RADAR_HISTORY'])

    const setActiveDisplayToggles = useCallback((toggles) => {
        setActiveToggles(toggles.filter((toggle) => toggle !== '-'))
    }, [])

    const isToggleActive = useCallback((toggle) => (
        activeToggles.includes(toggle)
    ), [activeToggles])

    const value = useMemo(() => ({
        activeToggles,
        setActiveDisplayToggles,
        isToggleActive,
        toggles: SENSOR_DISPLAY_TOGGLES,
    }), [activeToggles, setActiveDisplayToggles, isToggleActive])

    return (
        <SensorDisplayContext.Provider value={value}>
            {children}
        </SensorDisplayContext.Provider>
    )
}

export function useSensorDisplay() {
    const context = useContext(SensorDisplayContext)

    if (!context) {
        throw new Error('useSensorDisplay must be used inside SensorDisplayProvider')
    }

    return context
}
