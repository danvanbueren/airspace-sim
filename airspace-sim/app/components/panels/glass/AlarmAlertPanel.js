'use client'

import {useMemo, useState} from 'react'
import BasicGlassPanel from './BasicGlassPanel'
import AlarmAlertDetailModal from './AlarmAlertDetailModal'
import {Box, Button, Divider, Grid, IconButton, Stack, Typography} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useSimulation} from '@/app/contexts/SimulationContext'
import {getSignalLabel, isIffEmergencyAlertSignalId} from '@/app/simulation/signalDefinitions'
import {formatDateTimeGroup} from '@/app/tools/formatting/DateTime'

const ALARM_ALERT_PREVIEW_MAX_LENGTH = 120

function truncateAlarmAlertMessage(message, maxLength = ALARM_ALERT_PREVIEW_MAX_LENGTH) {
    if (message.length <= maxLength) {
        return message
    }

    return `${message.slice(0, maxLength)}...`
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

    const closeDetailModal = () => setOpenAlert(null)

    const deleteDetailAlert = () => {
        if (!openAlert) {
            return
        }

        const indexToDelete = alarmAlertQueue.findIndex(
            (alert) => alert.timestamp === openAlert.timestamp && alert.message === openAlert.message,
        )

        if (indexToDelete !== -1) {
            deleteAlarmAlert(indexToDelete)
        }

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
            timestamp={openAlert?.timestamp}
            signalLabel={openAlert?.signalLabel}
            onClose={closeDetailModal}
            onDelete={deleteDetailAlert}
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

                    {visibleAlerts.map((alert, index) => {
                        const showTrackFocus = isIffEmergencyAlertSignalId(alert.signalId)

                        const handleFocusTrack = (event) => {
                            event.stopPropagation()

                            if (!showTrackFocus) {
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

                        return (
                        <Box
                            key={`${alert.timestamp}-${index}`}
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
                                        onClick={() => setOpenAlert({
                                            message: alert.message,
                                            timestamp: alert.timestamp,
                                            signalLabel: getSignalLabel(alert.signalId),
                                        })}
                                        role='button'
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault()
                                                setOpenAlert({
                                                    message: alert.message,
                                                    timestamp: alert.timestamp,
                                                    signalLabel: getSignalLabel(alert.signalId),
                                                })
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
                                        <Typography
                                            sx={{
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {truncateAlarmAlertMessage(alert.message)}
                                        </Typography>
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
                                        alignContent: 'center',
                                    }}
                                >
                                    {showTrackFocus ? (
                                        <IconButton
                                            edge="start"
                                            size="small"
                                            aria-label="center map on track"
                                            onClick={handleFocusTrack}
                                        >
                                            <GpsFixedIcon fontSize="small"/>
                                        </IconButton>
                                    ) : null}
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        aria-label="delete alarm"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            const queueIndex = alarmAlertQueue.indexOf(alert)
                                            if (queueIndex !== -1) {
                                                deleteAlarmAlert(queueIndex)
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small"/>
                                    </IconButton>
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
