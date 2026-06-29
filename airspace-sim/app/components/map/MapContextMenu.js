'use client'

import {forwardRef} from 'react'
import {
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material'
import PositionReferenceEditor from '@/app/components/floating/windows/PositionReferenceEditor'
import {shouldShowDropAttention} from '@/app/simulation/trackAutoDrop'
import {isReferencePoint} from '@/app/simulation/trackKinds'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

const CONTEXT_MENU_WIDTH_PX = 300

const CONTEXT_MENU_MONOSPACE_SX = {
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

function getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const menuWidth = contextMenuSize.width
    const menuHeight = contextMenuSize.height

    let left = elementContainer.x
    let top = elementContainer.y

    if (menuWidth && left + menuWidth > containerWidth - edgePadding) {
        left = elementContainer.x - menuWidth
    }

    if (menuHeight && top + menuHeight > containerHeight - edgePadding) {
        top = elementContainer.y - menuHeight
    }

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

function getDynamicActionsSectionTitle(track) {
    if (isReferencePoint(track)) {
        return 'RP Actions'
    }

    if (track) {
        return 'Track Actions'
    }

    return 'Dynamic Actions'
}

const MapContextMenu = forwardRef(function MapContextMenu({
    elementContainer,
    contextMenuSize,
    mapContainerRef,
    onInitiateTrack,
    onCreateReferencePoint,
    onDropTrack,
    onRecoverTrack,
    onToggleDropProtect,
    onRemoveBearingRangeLine,
    onClearBearingRangeLines,
    lines,
}, ref) {
    if (!elementContainer) {
        return null
    }

    const hasBearingRangeLine = Boolean(elementContainer.line)
    const track = elementContainer.track ?? null
    const hasTrack = Boolean(track)
    const isReferencePointTrack = isReferencePoint(track)
    const showRecoverTrack = hasTrack && shouldShowDropAttention(track)
    const dropProtectEnabled = Boolean(track?.dropProtect) && !isReferencePointTrack
    const dynamicActionsSectionTitle = getDynamicActionsSectionTitle(track)

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'absolute',
                ...getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef),
                zIndex: UI_Z_INDEX.CONTEXT_MENU,
                width: CONTEXT_MENU_WIDTH_PX,
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
                ...CONTEXT_MENU_MONOSPACE_SX,
            }}
        >
            <Box sx={{bgcolor: 'primary.main', p: 2}}>
                <Typography sx={{fontWeight: 'bold', color: 'primary.contrastText', fontSize: '0.9rem'}}>
                    Dynamic Context Menu
                </Typography>
            </Box>

            <Stack spacing={1.5} sx={{p: 2}}>
                <PositionReferenceEditor
                    lat={elementContainer.lngLat.lat}
                    lng={elementContainer.lngLat.lng}
                    zIndex={UI_Z_INDEX.CONTEXT_MENU}
                    readOnly
                />

                <Divider sx={{py: 0.5}}/>

                <Typography sx={{fontWeight: 'bold', fontSize: '0.8rem'}}>
                    Scope Actions
                </Typography>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => {}}
                    sx={{justifyContent: 'flex-start'}}
                    fullWidth
                    disabled
                >
                    Set Home
                </Button>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onCreateReferencePoint(elementContainer)}
                    sx={{justifyContent: 'flex-start'}}
                    fullWidth
                >
                    Initiate Ref Point
                </Button>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onInitiateTrack(elementContainer)}
                    sx={{justifyContent: 'flex-start'}}
                    fullWidth
                >
                    Initiate Track
                </Button>

                <Divider sx={{py: 0.5}}/>

                <Typography sx={{fontWeight: 'bold', fontSize: '0.8rem'}}>
                    {dynamicActionsSectionTitle}
                </Typography>

                {showRecoverTrack ? (
                    <Button
                        color='warning'
                        size='small'
                        variant='outlined'
                        onClick={() => onRecoverTrack(track)}
                        sx={{justifyContent: 'flex-start'}}
                        fullWidth
                    >
                        Recover Track
                    </Button>
                ) : null}

                {hasTrack ? (
                    <Button
                        color='warning'
                        size='small'
                        variant='outlined'
                        onClick={() => onDropTrack(track)}
                        sx={{justifyContent: 'flex-start'}}
                        fullWidth
                        disabled={dropProtectEnabled}
                    >
                        Drop
                    </Button>
                ) : null}

                {hasTrack && !isReferencePointTrack ? (
                    <Button
                        color='primary'
                        size='small'
                        variant='outlined'
                        onClick={() => onToggleDropProtect(track)}
                        sx={{justifyContent: 'flex-start'}}
                        fullWidth
                    >
                        {dropProtectEnabled ? 'Disable Drop Protect' : 'Enable Drop Protect'}
                    </Button>
                ) : null}

                <Divider sx={{py: 0.5}}/>

                <Typography sx={{fontWeight: 'bold', fontSize: '0.8rem'}}>
                    Bearing/Range Lines
                </Typography>

                {hasBearingRangeLine ? (
                    <Button
                        color='primary'
                        size='small'
                        variant='outlined'
                        onClick={() => onRemoveBearingRangeLine(elementContainer.line.id)}
                        sx={{justifyContent: 'flex-start'}}
                        fullWidth
                    >
                        Clear line
                    </Button>
                ) : null}

                {!(hasBearingRangeLine && lines.length === 1) ? (
                    <Button
                        color='warning'
                        size='small'
                        variant='outlined'
                        onClick={onClearBearingRangeLines}
                        sx={{justifyContent: 'flex-start'}}
                        disabled={lines.length < 1}
                        fullWidth
                    >
                        Clear all lines
                    </Button>
                ) : null}
            </Stack>
        </Paper>
    )
})

export default MapContextMenu
