'use client'

import {useEffect, useMemo, useState} from 'react'
import BasicGlassPanel from './BasicGlassPanel'
import AlarmAlertDetailModal from './AlarmAlertDetailModal'
import AlarmAlertActionButtons from './AlarmAlertActionButtons'
import AlarmAlertMessageContent from './AlarmAlertMessageContent'
import {Box, Button, Divider, Grid, Stack, Typography} from '@mui/material'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useSimulation} from '@/app/contexts/SimulationContext'
import {getSignalLabel, isIffEmergencyAlertSignalId} from '@/app/simulation/signalDefinitions'
import {formatDateTimeGroup} from '@/app/tools/formatting/DateTime'
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

function buildDetailAlertState(alert) {
    return {
        id: alert.id,
        signalId: alert.signalId,
        message: alert.message,
        messageIcon: alert.messageIcon ?? null,
        timestamp: alert.timestamp,
        signalLabel: getSignalLabel(alert.signalId),
        trackId: alert.trackId ?? null,
        longitude: alert.longitude ?? null,
        latitude: alert.latitude ?? null,
        linkUrl: alert.linkUrl ?? null,
        linkLabel: alert.linkLabel ?? null,
    }
}

export default function AlarmAlertPanel() {
    const {alarmAlertQueue, deleteAlarmAlert, clearAlarmAlerts, flyToTrack, flyToCoordinates} = useAlarmAlertActions()
    const {getTrack} = useSimulation()
    const {appSettings} = useAppSettings()
    const [openAlert, setOpenAlert] = useState(null)

    const visibleAlerts = useMemo(() => {
        const inhibitedAlerts = new Set(appSettings.inhibitedAlerts ?? [])

        return alarmAlertQueue.filter((alert) => !inhibitedAlerts.has(alert.signalId))
    }, [alarmAlertQueue, appSettings.inhibitedAlerts])

    useEffect(() => {
        if (!openAlert?.id) {
            return
        }

        const stillVisible = visibleAlerts.some((alert) => alert.id === openAlert.id)

        if (!stillVisible) {
            setOpenAlert(null)
        }
    }, [openAlert?.id, visibleAlerts])

    const closeDetailModal = () => setOpenAlert(null)

    const focusTrackHandlers = {getTrack, flyToTrack, flyToCoordinates}

    const handleModalFocusTrack = () => {
        if (!openAlert) {
            return
        }

        focusAlertTrack(openAlert, focusTrackHandlers)
        closeDetailModal()
    }

    const handleModalOpenLink = () => {
        if (!openAlert) {
            return
        }

        openAlertLink(openAlert)
        closeDetailModal()
    }

    const deleteDetailAlert = () => {
        if (!openAlert?.id) {
            return
        }

        deleteAlarmAlert(openAlert.id)
        setOpenAlert(null)
    }

    if (visibleAlerts.length < 1 && openAlert === null) {
        return null
    }

    return (
        <>
        <AlarmAlertDetailModal
            open={openAlert !== null}
            message={openAlert?.message ?? ''}
            messageIcon={openAlert?.messageIcon ?? null}
            timestamp={openAlert?.timestamp}
            signalLabel={openAlert?.signalLabel}
            alert={openAlert}
            onClose={closeDetailModal}
            onDelete={deleteDetailAlert}
            onFocusTrack={handleModalFocusTrack}
            onOpenLink={handleModalOpenLink}
        />
        {visibleAlerts.length > 0 && (
        <BasicGlassPanel dense>
            <Button
                size='small'
                color='warning'
                variant='outlined'
                onClick={() => {
                    clearAlarmAlerts()
                    setOpenAlert(null)
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
                    overflowY: 'auto'
                }}
            >
                <Stack
                    direction='column'
                    spacing={1}
                    sx={{
                        p: 1,
                        width: '100%'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            opacity: 0.5,
                            alignSelf: 'center'
                        }}
                    >
                        END OF ALERTS
                    </Typography>

                    {visibleAlerts.map((alert) => {
                        const handleFocusTrack = (event) => {
                            event.stopPropagation()
                            focusAlertTrack(alert, focusTrackHandlers)
                        }

                        const handleOpenLink = (event) => {
                            event.stopPropagation()
                            openAlertLink(alert)
                        }

                        const openDetailModal = () => setOpenAlert(buildDetailAlertState(alert))

                        return (
                        <Box
                            key={alert.id}
                        >
                            <Divider
                                sx={{m: 1, mt: 0,}}
                            />
                            <Grid container
                                  sx={{
                                      borderRadius: 1,
                                      px: 1,
                                      '&:hover': {
                                          color: 'info.contrastText',
                                          backgroundColor: 'info.main',
                                      },
                                  }}
                            >
                                <Grid size='grow'>
                                    <Box
                                        sx={{
                                            pt: 1,
                                            cursor: 'pointer',
                                        }}
                                        onClick={openDetailModal}
                                        role='button'
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault()
                                                openDetailModal()
                                            }
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 'bold',
                                                fontSize: 12,
                                                opacity: 0.85,
                                            }}
                                        >
                                            {getSignalLabel(alert.signalId)}
                                        </Typography>
                                        <AlarmAlertMessageContent
                                            message={alert.message}
                                            messageIcon={alert.messageIcon}
                                            truncate
                                        />
                                        <Typography
                                            sx={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                fontFamily: 'monospace',
                                                fontSize: 14,
                                                py: 1,
                                                opacity: 0.5,
                                            }}
                                        >
                                            {formatDateTimeGroup(alert.timestamp)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid
                                    size='auto'
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <AlarmAlertActionButtons
                                        alert={alert}
                                        onFocusTrack={handleFocusTrack}
                                        onOpenLink={handleOpenLink}
                                        onDelete={(event) => {
                                            event.stopPropagation()
                                            deleteAlarmAlert(alert.id)
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                        )
                    })}
                </Stack>
            </Box>
        </BasicGlassPanel>
        )}
        </>
    )
}
