'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {
    getSignalDefinition,
    MISC_SIGNAL_ID,
} from '@/app/simulation/signalDefinitions'

const MapStateContext = createContext(null)

function normalizeAlarmAlertMessage(message) {
    if (message instanceof Error) {
        return message.stack || message.message || String(message)
    }

    if (typeof message === 'object' && message !== null) {
        try {
            return JSON.stringify(message)
        } catch {
            return String(message)
        }
    }

    return String(message)
}

function normalizeAlertInput(input) {
    if (typeof input === 'string') {
        return {
            signalId: MISC_SIGNAL_ID,
            message: input,
        }
    }

    if (input && typeof input === 'object') {
        const signalId = input.signalId ?? MISC_SIGNAL_ID
        const message = input.message ?? input

        return {
            signalId,
            message: normalizeAlarmAlertMessage(message),
        }
    }

    return {
        signalId: MISC_SIGNAL_ID,
        message: normalizeAlarmAlertMessage(input),
    }
}

export function MapStateProvider({children}) {
    const [alarmAlertQueue, setAlarmAlertQueue] = useState([])
    const [map, setMap] = useState(null)

    const addAlarmAlert = useCallback((input) => {
        const normalizedAlert = normalizeAlertInput(input)

        setAlarmAlertQueue((currentQueue) => [
            ...currentQueue,
            {
                timestamp: new Date(),
                signalId: normalizedAlert.signalId,
                message: normalizedAlert.message,
            },
        ])
    }, [])

    const deleteAlarmAlert = useCallback((indexToDelete) => {
        setAlarmAlertQueue((currentQueue) => currentQueue.filter((_, index) => index !== indexToDelete))
    }, [])

    const clearAlarmAlerts = useCallback(() => {
        setAlarmAlertQueue([])
    }, [])

    const registerMap = useCallback((mapInstance) => {
        setMap(mapInstance)
    }, [])

    const zoomIn = useCallback(() => {
        map?.zoomIn()
    }, [map])

    const zoomOut = useCallback(() => {
        map?.zoomOut()
    }, [map])

    const value = useMemo(() => ({
        alarmAlertQueue,
        addAlarmAlert,
        deleteAlarmAlert,
        clearAlarmAlerts,
        map,
        registerMap,
        zoomIn,
        zoomOut,
        getAlertSignalLabel: (signalId) => getSignalDefinition(signalId).label,
    }), [
        alarmAlertQueue,
        addAlarmAlert,
        deleteAlarmAlert,
        clearAlarmAlerts,
        map,
        registerMap,
        zoomIn,
        zoomOut,
    ])

    return (
        <MapStateContext.Provider value={value}>
            {children}
        </MapStateContext.Provider>
    )
}

export function useMapState() {
    const context = useContext(MapStateContext)

    if (!context) {
        throw new Error('useMapState must be used inside MapStateProvider')
    }

    return context
}
