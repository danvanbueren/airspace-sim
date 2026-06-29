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
import {useMapContainerSize} from '@/app/hooks/map/useMapContainerSize'
import {
    getLegacyMapClickWindowPosition,
    getTrackManagementWindowPosition,
    useTrackManagementWindowDrag,
} from '@/app/hooks/map/useTrackManagementWindowDrag'
import {absoluteToEdgeAnchor} from '@/app/tools/map/edgeAnchoredPosition'
import {getMapFloatingWindowMaxHeight} from '@/app/tools/map/mapFloatingWindowLayout'

const GEOMETRY_WINDOW_WIDTH = 300
const GEOMETRY_WINDOW_HEIGHT = 420

export default function GeometryWindow({
    geometryWindow,
    mapContainerRef,
    zIndex,
    onClose,
    onMoveComplete,
    onActivate,
}) {
    const windowRef = useRef(null)
    const {getShapeById} = useDrawGeometry()
    const shape = getShapeById(geometryWindow.shapeId)
    const mapContainerSize = useMapContainerSize(mapContainerRef)
    const viewportMaxWindowHeight = getMapFloatingWindowMaxHeight(mapContainerSize.height)

    const geometryWindowSize = useRef({
        width: GEOMETRY_WINDOW_WIDTH,
        height: GEOMETRY_WINDOW_HEIGHT,
    }).current

    const activateWindow = useCallback(() => {
        onActivate?.(geometryWindow.id)
    }, [geometryWindow.id, onActivate])

    const handleWindowPointerDown = useCallback((event) => {
        event.stopPropagation()
        activateWindow()
    }, [activateWindow])

    const {
        dragPosition,
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    } = useTrackManagementWindowDrag({
        mapContainerRef,
        onMoveComplete,
        onActivate: activateWindow,
        windowId: geometryWindow.id,
        trackManagementWindowSize: geometryWindowSize,
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
        const containerSize = {
            width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
            height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
        }

        onMoveComplete?.(
            geometryWindow.id,
            absoluteToEdgeAnchor(
                legacyPosition.left,
                legacyPosition.top,
                containerSize,
                {
                    width: geometryWindowSize.width,
                    height: geometryWindowSize.height,
                },
            ),
        )
    }, [
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
            ref={windowRef}
            data-geometry-window
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleWindowPointerDown}
            sx={{
                position: 'absolute',
                ...windowPosition,
                zIndex,
                width: GEOMETRY_WINDOW_WIDTH,
                maxHeight: viewportMaxWindowHeight,
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    flexShrink: 0,
                }}
            >
                <Box
                    aria-label='Drag Geometry window'
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        flex: 1,
                        minWidth: 0,
                        cursor: 'grab',
                        touchAction: 'none',
                    }}
                    onPointerDown={handleHeaderPointerDown}
                    onPointerMove={handleHeaderPointerMove}
                    onPointerUp={handleHeaderPointerUp}
                    onPointerCancel={handleHeaderPointerUp}
                >
                    <DragIndicatorIcon fontSize='small' sx={{opacity: 0.85}}/>
                    <Typography
                        variant='subtitle1'
                        component='span'
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {shape.name?.trim() || 'Geometry'}
                    </Typography>
                </Box>
                <IconButton size='small' aria-label='Close Geometry window' onClick={onClose}>
                    <CloseIcon fontSize='small'/>
                </IconButton>
            </Box>
            <Divider/>
            <Box sx={{overflow: 'auto', p: 1.5, flex: 1}}>
                <GeometryWindowBody shape={shape}/>
            </Box>
        </Paper>
    )
}
