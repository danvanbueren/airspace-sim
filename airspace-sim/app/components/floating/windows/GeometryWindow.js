'use client'

import {useCallback, useLayoutEffect, useRef} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {
    Box,
    Chip,
    IconButton,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material'
import FloatingWindowVerticalResizeHandle from '@/app/components/floating/shared/FloatingWindowVerticalResizeHandle'
import GeometryWindowBody from '@/app/components/floating/windows/GeometryWindowBody'
import {useDrawGeometry} from '@/app/contexts/DrawGeometryContext'
import {useMeasuredElementSize} from '@/app/hooks/global/useMeasuredElementSize'
import {useFloatingWindowVerticalResize} from '@/app/hooks/map/useFloatingWindowVerticalResize'
import {useMapContainerSize} from '@/app/hooks/map/useMapContainerSize'
import {geometryWindowShouldShowPendingPill} from '@/app/hooks/map/useGeometryWindows'
import {
    getBoundedTrackManagementWindowPosition,
    getLegacyMapClickWindowPosition,
    getTrackManagementWindowPosition,
    useTrackManagementWindowDrag,
} from '@/app/hooks/map/useTrackManagementWindowDrag'
import {absoluteToEdgeAnchor} from '@/app/tools/map/edgeAnchoredPosition'
import {getMapFloatingWindowMaxHeight} from '@/app/tools/map/mapFloatingWindowLayout'
import {TRACK_IDENTITIES} from '@/app/tools/milstd2525/trackSymbolCodes'
import {getTrackIdentityChromeColors} from '@/app/tools/milstd2525/trackIdentityColors'

const GEOMETRY_WINDOW_WIDTH = 300

const GEOMETRY_WINDOW_MONOSPACE_SX = {
    fontFamily: 'monospace',
    '& .MuiTypography-root': {
        fontFamily: 'monospace',
    },
    '& .MuiInputBase-root': {
        fontFamily: 'monospace',
    },
    '& .MuiInputLabel-root': {
        fontFamily: 'monospace',
    },
    '& .MuiFormHelperText-root': {
        fontFamily: 'monospace',
    },
    '& .MuiSelect-select': {
        fontFamily: 'monospace',
    },
}

function getGeometryWindowChromeColors(shape, theme) {
    const identity = geometryWindowShouldShowPendingPill(shape)
        ? TRACK_IDENTITIES.UNKNOWN
        : TRACK_IDENTITIES.FRIENDLY

    return getTrackIdentityChromeColors(identity, theme)
}

export default function GeometryWindow({
    geometryWindow,
    mapContainerRef,
    zIndex,
    onClose,
    onMoveComplete,
    onHeightCommit,
    onActivate,
    onClaimKeyboardCustody,
    hasKeyboardCustody = false,
    registerWindowElement,
    interactionsEnabled = true,
}) {
    const theme = useTheme()
    const geometryWindowRef = useRef(null)
    const {getShapeById} = useDrawGeometry()
    const shape = getShapeById(geometryWindow.shapeId)
    const mapContainerSize = useMapContainerSize(mapContainerRef)
    const viewportMaxWindowHeight = getMapFloatingWindowMaxHeight(mapContainerSize.height)
    const geometryWindowSize = useMeasuredElementSize(
        geometryWindowRef,
        [geometryWindow, shape, viewportMaxWindowHeight],
    )

    const setGeometryWindowRef = useCallback((element) => {
        geometryWindowRef.current = element
        registerWindowElement?.(geometryWindow.id, element)
    }, [geometryWindow.id, registerWindowElement])

    const activateWindow = useCallback(() => {
        onActivate?.(geometryWindow.id)
    }, [geometryWindow.id, onActivate])

    const handleWindowPointerDown = useCallback((event) => {
        event.stopPropagation()
        activateWindow()
        onClaimKeyboardCustody?.(geometryWindow.id)
    }, [activateWindow, geometryWindow.id, onClaimKeyboardCustody])

    const {
        dragPosition,
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    } = useTrackManagementWindowDrag({
        mapContainerRef,
        onMoveComplete,
        onActivate: activateWindow,
        onClaimKeyboardCustody,
        windowId: geometryWindow.id,
        trackManagementWindowSize: geometryWindowSize,
        windowElementSelector: '[data-geometry-window]',
    })

    const handleHeightCommit = useCallback((height) => {
        onHeightCommit?.(geometryWindow.id, height)
    }, [geometryWindow.id, onHeightCommit])

    const {
        height: resizedHeight,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    } = useFloatingWindowVerticalResize({
        windowRef: geometryWindowRef,
        mapContainerRef,
        interactionsEnabled,
        storedHeight: geometryWindow.height,
        maxHeight: viewportMaxWindowHeight,
        onHeightCommit: handleHeightCommit,
    })

    useLayoutEffect(() => {
        if (geometryWindow.positionAnchor) {
            return
        }

        if (!geometryWindowSize.width || !geometryWindowSize.height) {
            return
        }

        const legacyPosition = getLegacyMapClickWindowPosition(
            geometryWindow,
            geometryWindowSize,
            mapContainerRef,
        )
        const boundedPosition = getBoundedTrackManagementWindowPosition(
            legacyPosition.left,
            legacyPosition.top,
            geometryWindowSize,
            mapContainerRef,
        )
        const containerSize = {
            width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
            height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
        }

        onMoveComplete?.(
            geometryWindow.id,
            absoluteToEdgeAnchor(
                boundedPosition.left,
                boundedPosition.top,
                containerSize,
                {
                    width: geometryWindowSize.width,
                    height: geometryWindowSize.height,
                },
            ),
        )
    }, [
        geometryWindow,
        geometryWindow.id,
        geometryWindow.positionAnchor,
        geometryWindow.x,
        geometryWindow.y,
        geometryWindowSize,
        mapContainerRef,
        onMoveComplete,
    ])

    const windowPosition = dragPosition
        ? {left: dragPosition.x, top: dragPosition.y}
        : getTrackManagementWindowPosition(geometryWindow, geometryWindowSize, mapContainerRef)

    if (!shape) {
        return null
    }

    const windowChrome = getGeometryWindowChromeColors(shape, theme)
    const showPending = geometryWindowShouldShowPendingPill(shape)
    const hasExplicitHeight = typeof resizedHeight === 'number'

    const handleClose = () => {
        onClose?.()
    }

    return (
        <Paper
            ref={setGeometryWindowRef}
            data-geometry-window
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleWindowPointerDown}
            sx={(muiTheme) => ({
                position: 'absolute',
                ...windowPosition,
                zIndex,
                width: GEOMETRY_WINDOW_WIDTH,
                height: hasExplicitHeight ? resizedHeight : undefined,
                maxHeight: viewportMaxWindowHeight,
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
                ...GEOMETRY_WINDOW_MONOSPACE_SX,
                ...(hasKeyboardCustody && {
                    boxShadow: `inset 0 0 0 2px ${windowChrome.focusOutline}, ${muiTheme.shadows[8]}`,
                }),
            })}
        >
            <Box
                sx={{
                    bgcolor: windowChrome.headerBackground,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                <Box
                    onPointerDown={handleHeaderPointerDown}
                    onPointerMove={handleHeaderPointerMove}
                    onPointerUp={handleHeaderPointerUp}
                    onPointerCancel={handleHeaderPointerUp}
                    sx={{
                        px: 2,
                        py: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'move',
                        touchAction: 'none',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <DragIndicatorIcon
                        sx={{
                            color: windowChrome.headerText,
                            fontSize: '1rem',
                            flexShrink: 0,
                        }}
                    />
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            color: windowChrome.headerText,
                            fontSize: '0.9rem',
                            flexGrow: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Geometry
                    </Typography>
                    {showPending ? (
                        <Chip
                            label='Pending'
                            size='small'
                            variant='outlined'
                            sx={{
                                flexShrink: 0,
                                fontFamily: 'monospace',
                                color: windowChrome.headerText,
                                borderColor: windowChrome.headerText,
                            }}
                        />
                    ) : null}
                </Box>
                <IconButton
                    aria-label='Close geometry window'
                    size='small'
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        handleClose()
                    }}
                    sx={{
                        color: windowChrome.headerText,
                        p: 0.25,
                        mr: 1,
                        flexShrink: 0,
                    }}
                >
                    <CloseIcon fontSize='small'/>
                </IconButton>
            </Box>

            <Box
                sx={{
                    overflowY: 'auto',
                    flex: '1 1 auto',
                    minHeight: 0,
                }}
            >
                <Stack
                    spacing={1.5}
                    sx={{
                        p: 2,
                        userSelect: 'none',
                        '& .MuiInputBase-input': {
                            userSelect: 'text',
                        },
                        '& .MuiSelect-select': {
                            userSelect: 'text',
                        },
                    }}
                >
                    <GeometryWindowBody shape={shape}/>
                </Stack>
            </Box>

            <FloatingWindowVerticalResizeHandle
                interactionsEnabled={interactionsEnabled}
                onPointerDown={handleResizeHandlePointerDown}
                onPointerMove={handleResizeHandlePointerMove}
                onPointerUp={handleResizeHandlePointerUp}
            />
        </Paper>
    )
}
