'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'

const AlarmAlertContext = createContext(null)

export function AlarmAlertProvider({children}) {
    const [alarmAlertQueue, setAlarmAlertQueue] = useState([])

    const addAlarmAlert = useCallback((message) => {
        setAlarmAlertQueue((currentQueue) => [
            ...currentQueue,
            [new Date(), message],
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
        <AlarmAlertContext.Provider value={value}>
            {children}
        </AlarmAlertContext.Provider>
    )
}

export function useAlarmAlert() {
    const context = useContext(AlarmAlertContext)

    if (!context) {
        throw new Error('useAlarmAlert must be used inside AlarmAlertProvider')
    }

    return context
}