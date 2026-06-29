'use client'

import {useCallback, useRef} from 'react'
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

    const {
        windowPosition,
        handleWindowPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
    } = useTrackManagementWindowDrag({
        trackManagementWindow: geometryWindow,
        trackManagementWindowSize: geometryWindowSize,
        mapContainerRef,
        onMoveComplete,
    })

    const resolvedPosition = geometryWindow.positionAnchor
        ? getTrackManagementWindowPosition(geometryWindow, geometryWindowSize, mapContainerRef)
        : getLegacyMapClickWindowPosition(geometryWindow, geometryWindowSize, mapContainerRef)

    const handlePointerDown = useCallback((event) => {
        onActivate?.()
        handleWindowPointerDown(event)
    }, [handleWindowPointerDown, onActivate])

    const handleDragPointerDown = useCallback((event) => {
        onActivate?.()
        handleDragHandlePointerDown(event)
    }, [handleDragHandlePointerDown, onActivate])

    if (!shape) {
        return null
    }

    return (
        <Paper
            ref={windowRef}
            data-geometry-window
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handlePointerDown}
            sx={{
                position: 'absolute',
                ...(windowPosition ?? resolvedPosition),
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
                    onPointerDown={handleDragPointerDown}
                    onPointerMove={handleDragHandlePointerMove}
                    onPointerUp={handleDragHandlePointerUp}
                    onPointerCancel={handleDragHandlePointerUp}
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
