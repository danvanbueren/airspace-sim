'use client'

import {useCallback, useLayoutEffect, useRef} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {
    Box,
    Divider,
    IconButton,
    Paper,
    Typography,
} from '@mui/material'
import GeometryWindowBody from '@/app/components/floating/windows/GeometryWindowBody'
import {useDrawGeometry} from '@/app/contexts/DrawGeometryContext'
import {useMeasuredElementSize} from '@/app/hooks/global/useMeasuredElementSize'
import {useMapContainerSize} from '@/app/hooks/map/useMapContainerSize'
import {
    getBoundedTrackManagementWindowPosition,
    getLegacyMapClickWindowPosition,
    getTrackManagementWindowPosition,
    useTrackManagementWindowDrag,
} from '@/app/hooks/map/useTrackManagementWindowDrag'
import {absoluteToEdgeAnchor} from '@/app/tools/map/edgeAnchoredPosition'
import {getMapFloatingWindowMaxHeight} from '@/app/tools/map/mapFloatingWindowLayout'

const GEOMETRY_WINDOW_WIDTH = 300

export default function GeometryWindow({
    geometryWindow,
    mapContainerRef,
    zIndex,
    onClose,
    onMoveComplete,
    onActivate,
    onClaimKeyboardCustody,
    hasKeyboardCustody = false,
    registerWindowElement,
}) {
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

    return (
        <Paper
            ref={setGeometryWindowRef}
            data-geometry-window
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleWindowPointerDown}
            sx={(theme) => ({
                position: 'absolute',
                ...windowPosition,
                zIndex,
                width: GEOMETRY_WINDOW_WIDTH,
                maxHeight: viewportMaxWindowHeight,
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
                ...(hasKeyboardCustody && {
                    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}, ${theme.shadows[8]}`,
                }),
            })}
        >
            <Box
                onPointerDown={handleHeaderPointerDown}
                onPointerMove={handleHeaderPointerMove}
                onPointerUp={handleHeaderPointerUp}
                onPointerCancel={handleHeaderPointerUp}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    flexShrink: 0,
                    cursor: 'move',
                    touchAction: 'none',
                }}
            >
                <DragIndicatorIcon fontSize='small' sx={{opacity: 0.85, flexShrink: 0}}/>
                <Typography
                    variant='subtitle1'
                    component='span'
                    sx={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {shape.name?.trim() || 'Geometry'}
                </Typography>
                <IconButton
                    size='small'
                    aria-label='Close Geometry window'
                    sx={{flexShrink: 0}}
                    onClick={onClose}
                >
                    <CloseIcon fontSize='small'/>
                </IconButton>
            </Box>
            <Divider sx={{flexShrink: 0}}/>
            <Box
                sx={{
                    overflow: 'auto',
                    p: 1.5,
                    flex: 1,
                    minHeight: 0,
                    userSelect: 'text',
                }}
            >
                <GeometryWindowBody shape={shape}/>
            </Box>
        </Paper>
    )
}
