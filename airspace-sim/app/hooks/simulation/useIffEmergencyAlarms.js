'use client'

import {useEffect, useRef} from 'react'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {
    buildIffEmergencyAlarmMessage,
    formatMode3Code,
    getEmergencyAlertSignalId,
    isEmergencyMode3Code,
    isIffMode3Stale,
} from '@/app/simulation/iffMode3'

/**
 * Raise alarm alerts when tracks correlate to emergency IFF Mode 3 codes.
 *
 * @param {import('@/app/simulation/types.js').TrackState[]} tracks
 * @param {number} evaluationTime
 * @param {number} iffRefreshMs
 */
export function useIffEmergencyAlarms(tracks, evaluationTime, iffRefreshMs) {
    const {raiseAlarmAlert} = useAlarmAlertActions()
    const raisedAlarmKeysRef = useRef(new Set())

    useEffect(() => {
        const activeKeys = new Set()

        tracks.forEach((track) => {
            const trackId = track.trackId ?? track.id
            const mode3Code = formatMode3Code(track.iffMode3Code)

            if (!trackId || !isEmergencyMode3Code(mode3Code)) {
                return
            }

            if (isIffMode3Stale(track, evaluationTime, iffRefreshMs)) {
                return
            }

            const alarmKey = `${trackId}:${mode3Code}`
            activeKeys.add(alarmKey)

            if (raisedAlarmKeysRef.current.has(alarmKey)) {
                return
            }

            const signalId = getEmergencyAlertSignalId(mode3Code)

            if (!signalId) {
                return
            }

            const raised = raiseAlarmAlert({
                signalId,
                message: buildIffEmergencyAlarmMessage(track, mode3Code),
                trackId,
                longitude: track.longitude,
                latitude: track.latitude,
            })

            if (raised) {
                raisedAlarmKeysRef.current.add(alarmKey)
            }
        })

        raisedAlarmKeysRef.current.forEach((key) => {
            if (!activeKeys.has(key)) {
                raisedAlarmKeysRef.current.delete(key)
            }
        })
    }, [evaluationTime, iffRefreshMs, raiseAlarmAlert, tracks])
}
