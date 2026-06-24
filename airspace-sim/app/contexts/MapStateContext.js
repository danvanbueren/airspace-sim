'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {
    getSignalDefinition,
    MISC_SIGNAL_ID,
} from '@/app/simulation/signalDefinitions'

const MapStateContext = createContext(null)

export const ALARM_TRACK_FOCUS_ZOOM = 10

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
            trackId: input.trackId ?? null,
            longitude: input.longitude ?? null,
            latitude: input.latitude ?? null,
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
                trackId: normalizedAlert.trackId ?? null,
                longitude: normalizedAlert.longitude ?? null,
                latitude: normalizedAlert.latitude ?? null,
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

    const flyToCoordinates = useCallback((longitude, latitude, zoom = ALARM_TRACK_FOCUS_ZOOM) => {
        if (!map || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            return false
        }

        map.flyTo({
            center: [longitude, latitude],
            zoom,
            essential: true,
        })

        return true
    }, [map])

    const flyToTrack = useCallback((track) => {
        if (!track) {
            return false
        }

        const longitude = track.longitude
        const latitude = track.latitude

        return flyToCoordinates(longitude, latitude)
    }, [flyToCoordinates])

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
        flyToCoordinates,
        flyToTrack,
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
        flyToCoordinates,
        flyToTrack,
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
