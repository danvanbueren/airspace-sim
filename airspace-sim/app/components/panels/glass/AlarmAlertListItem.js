'use client'

import {Box, Divider, Grid, Typography} from '@mui/material'
import AlarmAlertActionButtons from './AlarmAlertActionButtons'
import AlarmAlertMessageContent from './AlarmAlertMessageContent'
import {getSignalLabel} from '@/app/simulation/signalDefinitions'
import {formatDateTimeGroup} from '@/app/tools/formatting/DateTime'

const VARIANT_STYLES = {
    panel: {
        signalLabel: {
            fontSize: 12,
        },
        timestamp: {
            fontSize: 14,
        },
        truncate: true,
    },
    modal: {
        signalLabel: {
            fontSize: 14,
        },
        timestamp: {
            fontSize: 14,
        },
        truncate: false,
    },
}

export default function AlarmAlertListItem({
    alert,
    variant = 'panel',
    highlighted = false,
    showDivider = true,
    onContentClick = null,
    onFocusTrack,
    onOpenLink,
    onDelete,
    itemRef = null,
}) {
    const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.panel
    const isInteractive = typeof onContentClick === 'function'

    const handleFocusTrack = (event) => {
        event.stopPropagation()
        onFocusTrack?.(event)
    }

    const handleOpenLink = (event) => {
        event.stopPropagation()
        onOpenLink?.(event)
    }

    const handleDelete = (event) => {
        event.stopPropagation()
        onDelete?.(event)
    }

    return (
        <Box ref={itemRef} data-alert-id={alert.id}>
            {showDivider ? (
                <Divider sx={{m: 1, mt: 0}}/>
            ) : null}
            <Grid
                container
                sx={{
                    borderRadius: 1,
                    px: 1,
                    ...(highlighted
                        ? {
                            color: 'info.contrastText',
                            backgroundColor: 'info.main',
                        }
                        : {
                            '&:hover': {
                                color: 'info.contrastText',
                                backgroundColor: 'info.main',
                            },
                        }),
                }}
            >
                <Grid size='grow'>
                    <Box
                        sx={{
                            pt: 1,
                            ...(isInteractive
                                ? {
                                    cursor: 'pointer',
                                }
                                : {}),
                        }}
                        onClick={onContentClick ?? undefined}
                        role={isInteractive ? 'button' : undefined}
                        tabIndex={isInteractive ? 0 : undefined}
                        onKeyDown={isInteractive
                            ? (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    onContentClick?.()
                                }
                            }
                            : undefined}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                opacity: 0.85,
                                ...styles.signalLabel,
                            }}
                        >
                            {getSignalLabel(alert.signalId)}
                        </Typography>
                        <AlarmAlertMessageContent
                            message={alert.message}
                            messageIcon={alert.messageIcon}
                            truncate={styles.truncate}
                            typographySx={variant === 'modal'
                                ? {fontSize: 14, m: 0}
                                : {}}
                        />
                        <Typography
                            sx={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                fontFamily: 'monospace',
                                py: 1,
                                opacity: 0.5,
                                ...styles.timestamp,
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
                        onDelete={handleDelete}
                    />
                </Grid>
            </Grid>
        </Box>
    )
}
