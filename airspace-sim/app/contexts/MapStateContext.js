'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'

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

export function MapStateProvider({children}) {
    const [alarmAlertQueue, setAlarmAlertQueue] = useState([])

    const addAlarmAlert = useCallback((message) => {
        setAlarmAlertQueue((currentQueue) => [
            ...currentQueue,
            [new Date(), normalizeAlarmAlertMessage(message)],
        ])
    }, [])

    const deleteAlarmAlert = useCallback((indexToDelete) => {
        setAlarmAlertQueue((currentQueue) => currentQueue.filter((_, index) => index !== indexToDelete))
    }, [])

    const clearAlarmAlerts = useCallback(() => {
        setAlarmAlertQueue([])
    }, [])

    const value = useMemo(() => ({
        alarmAlertQueue,
        addAlarmAlert,
        deleteAlarmAlert,
        clearAlarmAlerts,
    }), [alarmAlertQueue, addAlarmAlert, deleteAlarmAlert, clearAlarmAlerts])

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