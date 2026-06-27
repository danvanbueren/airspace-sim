'use client'

import {useLayoutEffect, useRef, useState} from 'react'
import {alpha, Box, Button, Modal, Stack, Typography} from '@mui/material'
import AlarmAlertListItem from './AlarmAlertListItem'
import {GLASS_PANEL_BORDER_STYLE, getGlassPanelSurfaceSx} from './glassPanelSurface'
import {calculateAlarmAlertModalDimensions} from '@/app/tools/alerts/alarmAlertModalDimensions'

const MODAL_PADDING_PX = 24
const CLEAR_ALL_BUTTON_HEIGHT_PX = 36
const END_OF_ALERTS_HEIGHT_PX = 28

function getModalChromeHeight(showClearAll) {
    return (
        MODAL_PADDING_PX * 2
        + (showClearAll ? CLEAR_ALL_BUTTON_HEIGHT_PX + 8 : 0)
        + END_OF_ALERTS_HEIGHT_PX
    )
}

export default function AlarmAlertDetailModal({
    open,
    alerts,
    focusedAlertId = null,
    onClose,
    onClearAll,
    onDelete,
    onFocusTrack,
    onOpenLink,
}) {
    const scrollContainerRef = useRef(null)
    const contentRef = useRef(null)
    const alertItemRefs = useRef(new Map())
    const dimensionsLockedRef = useRef(false)
    const [lockedDimensions, setLockedDimensions] = useState(null)

    const showClearAll = alerts.length > 1

    useLayoutEffect(() => {
        if (!open) {
            dimensionsLockedRef.current = false
            setLockedDimensions(null)
            return
        }

        if (dimensionsLockedRef.current) {
            return
        }

        const contentElement = contentRef.current
        if (!contentElement) {
            return
        }

        const rootFontSizePx = Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
        ) || 16
        const chromeHeight = getModalChromeHeight(showClearAll)

        const {width, height} = calculateAlarmAlertModalDimensions({
            contentScrollHeight: contentElement.scrollHeight,
            chromeHeight,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth,
            rootFontSizePx,
        })

        dimensionsLockedRef.current = true
        setLockedDimensions({width, height})
    }, [open, showClearAll])

    useLayoutEffect(() => {
        if (!open || !focusedAlertId) {
            return
        }

        const alertElement = alertItemRefs.current.get(focusedAlertId)
        alertElement?.scrollIntoView({block: 'center'})
    }, [open, focusedAlertId, lockedDimensions])

    const setAlertItemRef = (alertId) => (element) => {
        if (element) {
            alertItemRefs.current.set(alertId, element)
            return
        }

        alertItemRefs.current.delete(alertId)
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box
                sx={(theme) => ({
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    outline: 'none',
                    overflow: 'hidden',
                    p: `${MODAL_PADDING_PX}px`,
                    ...GLASS_PANEL_BORDER_STYLE,
                    backgroundColor: alpha(theme.palette.background.paper, 0.75),
                    backdropFilter: 'blur(10px)',
                    boxShadow: 24,
                    ...(lockedDimensions
                        ? {
                            width: lockedDimensions.width,
                            height: lockedDimensions.height,
                            maxWidth: '90vw',
                            maxHeight: '90dvh',
                        }
                        : {
                            visibility: 'hidden',
                            width: 'min(40rem, 90vw)',
                            maxHeight: '90dvh',
                        }),
                })}
            >
                {showClearAll ? (
                    <Button
                        size='small'
                        color='warning'
                        variant='outlined'
                        onClick={onClearAll}
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            px: 1,
                            mb: 1,
                            alignSelf: 'center',
                            flexShrink: 0,
                        }}
                    >
                        Clear All
                    </Button>
                ) : null}

                <Box
                    ref={scrollContainerRef}
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        overflowY: 'auto',
                    }}
                >
                    <Stack
                        ref={contentRef}
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

                        {alerts.map((alert, index) => (
                            <AlarmAlertListItem
                                key={alert.id}
                                alert={alert}
                                variant='modal'
                                highlighted={alert.id === focusedAlertId}
                                showDivider={index > 0}
                                itemRef={setAlertItemRef(alert.id)}
                                onFocusTrack={() => onFocusTrack?.(alert)}
                                onOpenLink={() => onOpenLink?.(alert)}
                                onDelete={() => onDelete?.(alert)}
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Modal>
    )
}
