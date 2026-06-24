'use client'

import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react'
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
            raisedAt: input.raisedAt ?? null,
            alarmKey: input.alarmKey ?? null,
        }
    }

    return {
        signalId: MISC_SIGNAL_ID,
        message: normalizeAlarmAlertMessage(input),
    }
}

function toAlertTimestamp(raisedAt) {
    if (raisedAt instanceof Date) {
        return raisedAt
    }

    if (typeof raisedAt === 'number' && Number.isFinite(raisedAt)) {
        return new Date(raisedAt)
    }

    return new Date()
}

export function MapStateProvider({children}) {
    const [alarmAlertQueue, setAlarmAlertQueue] = useState([])
    const [map, setMap] = useState(null)
    const nextAlertIdRef = useRef(1)
    const raisedEmergencyAlarmKeysRef = useRef(new Set())

    const isEmergencyAlarmRaised = useCallback((alarmKey) => (
        raisedEmergencyAlarmKeysRef.current.has(alarmKey)
    ), [])

    const markEmergencyAlarmRaised = useCallback((alarmKey) => {
        if (alarmKey) {
            raisedEmergencyAlarmKeysRef.current.add(alarmKey)
        }
    }, [])

    const clearEmergencyAlarmRaised = useCallback((alarmKey) => {
        if (alarmKey) {
            raisedEmergencyAlarmKeysRef.current.delete(alarmKey)
        }
    }, [])

    const sweepInactiveEmergencyAlarmKeys = useCallback((activeKeys) => {
        for (const key of [...raisedEmergencyAlarmKeysRef.current]) {
            if (!activeKeys.has(key)) {
                raisedEmergencyAlarmKeysRef.current.delete(key)
            }
        }
    }, [])

    const addAlarmAlert = useCallback((input) => {
        const normalizedAlert = normalizeAlertInput(input)
        const id = nextAlertIdRef.current
        nextAlertIdRef.current += 1

        setAlarmAlertQueue((currentQueue) => [
            ...currentQueue,
            {
                id,
                timestamp: toAlertTimestamp(normalizedAlert.raisedAt),
                signalId: normalizedAlert.signalId,
                message: normalizedAlert.message,
                trackId: normalizedAlert.trackId ?? null,
                longitude: normalizedAlert.longitude ?? null,
                latitude: normalizedAlert.latitude ?? null,
                alarmKey: normalizedAlert.alarmKey ?? null,
            },
        ])

        return id
    }, [])

    const deleteAlarmAlert = useCallback((alertId) => {
        setAlarmAlertQueue((currentQueue) => {
            const alert = currentQueue.find((entry) => entry.id === alertId)

            if (alert?.alarmKey) {
                raisedEmergencyAlarmKeysRef.current.delete(alert.alarmKey)
            }

            return currentQueue.filter((entry) => entry.id !== alertId)
        })
    }, [])

    const clearAlarmAlerts = useCallback(() => {
        raisedEmergencyAlarmKeysRef.current.clear()
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

        return flyToCoordinates(track.longitude, track.latitude)
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
        isEmergencyAlarmRaised,
        markEmergencyAlarmRaised,
        clearEmergencyAlarmRaised,
        sweepInactiveEmergencyAlarmKeys,
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
        isEmergencyAlarmRaised,
        markEmergencyAlarmRaised,
        clearEmergencyAlarmRaised,
        sweepInactiveEmergencyAlarmKeys,
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
