'use client'

import {useEffect, useRef} from 'react'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {buildSeedAlarmKey, SEED_ALARM_ALERTS} from '@/app/content/seedAlarmAlerts'

export default function useSeedAlarmAlerts() {
    const {alarmAlertQueue, raiseAlarmAlert} = useAlarmAlertActions()
    const seededKeysRef = useRef(new Set())

    useEffect(() => {
        const raisedAlarmKeys = new Set(
            alarmAlertQueue
                .map((alert) => alert.alarmKey)
                .filter(Boolean),
        )

        for (const seedAlert of SEED_ALARM_ALERTS) {
            const alarmKey = buildSeedAlarmKey(seedAlert)

            if (seededKeysRef.current.has(alarmKey) || raisedAlarmKeys.has(alarmKey)) {
                continue
            }

            const raised = raiseAlarmAlert({
                signalId: seedAlert.signalId,
                message: seedAlert.message,
                messageIcon: seedAlert.messageIcon ?? null,
                linkUrl: seedAlert.linkUrl ?? null,
                linkLabel: seedAlert.linkLabel ?? null,
                alarmKey,
            })

            if (raised) {
                seededKeysRef.current.add(alarmKey)
            }
        }
    }, [alarmAlertQueue, raiseAlarmAlert])
}
