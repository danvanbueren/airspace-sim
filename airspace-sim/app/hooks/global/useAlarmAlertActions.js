'use client'

import {useCallback} from 'react'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useMapState} from '@/app/contexts/MapStateContext'
import {MISC_SIGNAL_ID} from '@/app/simulation/signalDefinitions'

function inferAlertSignalId(message) {
    if (typeof message !== 'string') {
        return MISC_SIGNAL_ID
    }

    if (message.startsWith('Unhandled promise rejection')) {
        return 'UNHANDLED_REJECTION'
    }

    if (message.startsWith('React component error')) {
        return 'REACT_ERROR'
    }

    if (message.startsWith('Browser error')) {
        return 'BROWSER_ERROR'
    }

    return MISC_SIGNAL_ID
}

export function useAlarmAlertActions() {
    const {
        addAlarmAlert,
        isEmergencyAlarmRaised,
        markEmergencyAlarmRaised,
        clearEmergencyAlarmRaised,
        sweepInactiveEmergencyAlarmKeys,
        ...mapState
    } = useMapState()
    const {appSettings, updateAppSettings} = useAppSettings()
    const inhibitedAlerts = appSettings.inhibitedAlerts ?? []

    const raiseAlarmAlert = useCallback((input) => {
        const normalizedInput = typeof input === 'string'
            ? {
                signalId: inferAlertSignalId(input),
                message: input,
            }
            : input

        const signalId = normalizedInput?.signalId ?? MISC_SIGNAL_ID

        if (inhibitedAlerts.includes(signalId)) {
            return false
        }

        addAlarmAlert(normalizedInput)
        return true
    }, [addAlarmAlert, inhibitedAlerts])

    const inhibitAlertSignal = useCallback((signalId) => {
        if (typeof signalId !== 'string' || inhibitedAlerts.includes(signalId)) {
            return
        }

        updateAppSettings((currentSettings) => ({
            ...currentSettings,
            inhibitedAlerts: [...(currentSettings.inhibitedAlerts ?? []), signalId],
        }))
    }, [inhibitedAlerts, updateAppSettings])

    return {
        ...mapState,
        addAlarmAlert,
        raiseAlarmAlert,
        inhibitAlertSignal,
        isEmergencyAlarmRaised,
        markEmergencyAlarmRaised,
        clearEmergencyAlarmRaised,
        sweepInactiveEmergencyAlarmKeys,
    }
}
