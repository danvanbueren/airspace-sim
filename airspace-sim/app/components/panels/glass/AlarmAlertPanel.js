'use client'

import {useEffect, useMemo, useState} from 'react'
import BasicGlassPanel from './BasicGlassPanel'
import AlarmAlertDetailModal from './AlarmAlertDetailModal'
import AlarmAlertListItem from './AlarmAlertListItem'
import {Box, Button, Stack, Typography} from '@mui/material'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useSimulation} from '@/app/contexts/SimulationContext'
import {isIffEmergencyAlertSignalId} from '@/app/simulation/signalDefinitions'
import {openAlertLink} from '@/app/tools/alerts/alarmAlertUi'

function focusAlertTrack(alert, {getTrack, flyToTrack, flyToCoordinates}) {
    if (!isIffEmergencyAlertSignalId(alert.signalId)) {
        return
    }

    const liveTrack = alert.trackId ? getTrack(alert.trackId) : null

    if (liveTrack) {
        flyToTrack(liveTrack)
        return
    }

    if (Number.isFinite(alert.longitude) && Number.isFinite(alert.latitude)) {
        flyToCoordinates(alert.longitude, alert.latitude)
    }
}

export default function AlarmAlertPanel() {
    const {
        alarmAlertQueue,
        deleteAlarmAlert,
        clearAlarmAlerts,
        flyToTrack,
        flyToCoordinates,
        inhibitAlertSignal,
    } = useAlarmAlertActions()
    const {getTrack} = useSimulation()
    const {appSettings} = useAppSettings()
    const [modalOpen, setModalOpen] = useState(false)
    const [focusedAlertId, setFocusedAlertId] = useState(null)

    const visibleAlerts = useMemo(() => {
        const inhibitedAlerts = new Set(appSettings.inhibitedAlerts ?? [])

        return alarmAlertQueue.filter((alert) => !inhibitedAlerts.has(alert.signalId))
    }, [alarmAlertQueue, appSettings.inhibitedAlerts])

    useEffect(() => {
        if (!modalOpen) {
            return
        }

        if (visibleAlerts.length < 1) {
            setModalOpen(false)
            setFocusedAlertId(null)
        }
    }, [modalOpen, visibleAlerts.length])

    const closeDetailModal = () => {
        setModalOpen(false)
        setFocusedAlertId(null)
    }

    const focusTrackHandlers = {getTrack, flyToTrack, flyToCoordinates}

    const handleModalFocusTrack = (alert) => {
        focusAlertTrack(alert, focusTrackHandlers)
        closeDetailModal()
    }

    const handleModalOpenLink = (alert) => {
        openAlertLink(alert)
        closeDetailModal()
    }

    const handleModalDelete = (alert) => {
        deleteAlarmAlert(alert.id)
    }

    const handleModalInhibit = (alert) => {
        inhibitAlertSignal(alert.signalId)
        closeDetailModal()
    }

    const openDetailModal = (alertId) => {
        setFocusedAlertId(alertId)
        setModalOpen(true)
    }

    if (visibleAlerts.length < 1 && !modalOpen) {
        return null
    }

    return (
        <>
            <AlarmAlertDetailModal
                open={modalOpen}
                alerts={visibleAlerts}
                focusedAlertId={focusedAlertId}
                onClose={closeDetailModal}
                onClearAll={() => {
                    clearAlarmAlerts()
                    closeDetailModal()
                }}
                onDelete={handleModalDelete}
                onInhibit={handleModalInhibit}
                onFocusTrack={handleModalFocusTrack}
                onOpenLink={handleModalOpenLink}
                onFocusAlert={setFocusedAlertId}
            />
            {visibleAlerts.length > 0 && (
                <BasicGlassPanel dense>
                    <Button
                        size='small'
                        color='warning'
                        variant='outlined'
                        onClick={() => {
                            clearAlarmAlerts()
                            closeDetailModal()
                        }}
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            px: 1,
                            my: 0.5,
                        }}
                    >
                        Clear All
                    </Button>
                    <Box
                        sx={{
                            width: '20rem',
                            maxHeight: '10rem',
                            display: 'flex',
                            flexDirection: 'column-reverse',
                            overflowY: 'auto',
                        }}
                    >
                        <Stack
                            direction='column'
                            spacing={1}
                            sx={{
                                p: 1,
                                width: '100%',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    opacity: 0.5,
                                    alignSelf: 'center',
                                }}
                            >
                                END OF ALERTS
                            </Typography>

                            {visibleAlerts.map((alert, index) => (
                                <AlarmAlertListItem
                                    key={alert.id}
                                    alert={alert}
                                    variant='panel'
                                    showDivider={index > 0}
                                    onContentClick={() => openDetailModal(alert.id)}
                                    onFocusTrack={() => focusAlertTrack(alert, focusTrackHandlers)}
                                    onOpenLink={() => openAlertLink(alert)}
                                    onInhibit={() => inhibitAlertSignal(alert.signalId)}
                                    onDelete={() => deleteAlarmAlert(alert.id)}
                                />
                            ))}
                        </Stack>
                    </Box>
                </BasicGlassPanel>
            )}
        </>
    )
}
