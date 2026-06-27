'use client'

import {useLayoutEffect, useRef} from 'react'
import {alpha, Box, Button, Modal, Stack, Typography} from '@mui/material'
import AlarmAlertListItem from './AlarmAlertListItem'
import {MAP_PANEL_BORDER_STYLE} from '@/app/components/panels/panelSurface'
import {
    calculateAlarmAlertModalDimensions,
    estimateAlarmAlertContentHeight,
    getAlarmAlertModalChromeHeight,
} from '@/app/tools/alerts/alarmAlertModalDimensions'
import {scrollAlertIntoCenter} from '@/app/tools/alerts/alarmAlertUi'

const MODAL_PADDING_PX = 24

function getRootFontSizePx() {
    if (typeof window === 'undefined') {
        return 16
    }

    return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

function computeModalDimensions(alerts, showClearAll) {
    const rootFontSizePx = getRootFontSizePx()

    return calculateAlarmAlertModalDimensions({
        contentScrollHeight: estimateAlarmAlertContentHeight(alerts),
        chromeHeight: getAlarmAlertModalChromeHeight(showClearAll),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        rootFontSizePx,
    })
}

export default function AlarmAlertDetailModal({
    open,
    alerts,
    focusedAlertId = null,
    onClose,
    onClearAll,
    onDelete,
    onInhibit,
    onFocusTrack,
    onOpenLink,
    onFocusAlert,
}) {
    const scrollContainerRef = useRef(null)
    const alertItemRefs = useRef(new Map())
    const lockedDimensionsRef = useRef(null)
    const wasOpenRef = useRef(false)

    const showClearAll = alerts.length > 1

    if (open && !wasOpenRef.current) {
        lockedDimensionsRef.current = computeModalDimensions(alerts, showClearAll)
    }

    if (!open) {
        lockedDimensionsRef.current = null
    }

    wasOpenRef.current = open

    const lockedDimensions = lockedDimensionsRef.current

    useLayoutEffect(() => {
        if (!open || !focusedAlertId) {
            return
        }

        const scrollToFocusedAlert = () => {
            scrollAlertIntoCenter(
                scrollContainerRef.current,
                alertItemRefs.current.get(focusedAlertId),
            )
        }

        scrollToFocusedAlert()
        requestAnimationFrame(scrollToFocusedAlert)
    }, [open, focusedAlertId])

    const setAlertItemRef = (alertId) => (element) => {
        if (element) {
            alertItemRefs.current.set(alertId, element)
            return
        }

        alertItemRefs.current.delete(alertId)
    }

    if (!open || !lockedDimensions) {
        return null
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
                    width: lockedDimensions.width,
                    height: lockedDimensions.height,
                    maxWidth: '90vw',
                    maxHeight: '90dvh',
                    p: `${MODAL_PADDING_PX}px`,
                    ...MAP_PANEL_BORDER_STYLE,
                    backgroundColor: alpha(theme.palette.background.paper, 0.75),
                    backdropFilter: 'blur(10px)',
                    boxShadow: 24,
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

                        {alerts.map((alert, index) => (
                            <AlarmAlertListItem
                                key={alert.id}
                                alert={alert}
                                variant='modal'
                                outlined={alert.id === focusedAlertId}
                                showDivider={index > 0}
                                itemRef={setAlertItemRef(alert.id)}
                                onContentClick={() => onFocusAlert?.(alert.id)}
                                onFocusTrack={() => onFocusTrack?.(alert)}
                                onOpenLink={() => onOpenLink?.(alert)}
                                onInhibit={() => onInhibit?.(alert)}
                                onDelete={() => onDelete?.(alert)}
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Modal>
    )
}
