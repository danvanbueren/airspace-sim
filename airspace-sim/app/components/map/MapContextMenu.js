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

const CONTEXT_MENU_WIDTH_PX = 236

const CONTEXT_MENU_SECTION_HEADING_SX = {
    fontWeight: 'bold',
    fontSize: '0.9rem',
}

const CONTEXT_MENU_BUTTON_SX = {
    justifyContent: 'flex-start',
    py: 0.875,
    minHeight: 36,
}

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
    const showBearingRangeSection = lines.length >= 1 || hasBearingRangeLine
    const track = elementContainer.track ?? null
    const hasTrack = Boolean(track)
    const isReferencePointTrack = isReferencePoint(track)
    const showRecoverTrack = hasTrack && shouldShowDropAttention(track)
    const dropProtectEnabled = Boolean(track?.dropProtect) && !isReferencePointTrack
    const hasDynamicActions = hasTrack
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
                    compact
                />

                <Typography sx={CONTEXT_MENU_SECTION_HEADING_SX}>
                    Scope Actions
                </Typography>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => {}}
                    sx={CONTEXT_MENU_BUTTON_SX}
                    fullWidth
                    disabled
                >
                    Set Home
                </Button>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onInitiateTrack(elementContainer)}
                    sx={CONTEXT_MENU_BUTTON_SX}
                    fullWidth
                >
                    Initiate Track
                </Button>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onCreateReferencePoint(elementContainer)}
                    sx={CONTEXT_MENU_BUTTON_SX}
                    fullWidth
                >
                    Initiate Ref Point
                </Button>

                {hasDynamicActions ? (
                    <>
                        <Divider sx={{py: 0.5}}/>

                        <Typography sx={CONTEXT_MENU_SECTION_HEADING_SX}>
                            {dynamicActionsSectionTitle}
                        </Typography>

                        {showRecoverTrack ? (
                            <Button
                                color='warning'
                                size='small'
                                variant='outlined'
                                onClick={() => onRecoverTrack(track)}
                                sx={CONTEXT_MENU_BUTTON_SX}
                                fullWidth
                            >
                                Recover Track
                            </Button>
                        ) : null}

                        <Button
                            color='warning'
                            size='small'
                            variant='outlined'
                            onClick={() => onDropTrack(track)}
                            sx={CONTEXT_MENU_BUTTON_SX}
                            fullWidth
                            disabled={dropProtectEnabled}
                        >
                            Drop
                        </Button>

                        {!isReferencePointTrack ? (
                            <Button
                                color='primary'
                                size='small'
                                variant='outlined'
                                onClick={() => onToggleDropProtect(track)}
                                sx={CONTEXT_MENU_BUTTON_SX}
                                fullWidth
                            >
                                {dropProtectEnabled ? 'Disable Drop Protect' : 'Enable Drop Protect'}
                            </Button>
                        ) : null}
                    </>
                ) : null}

                {showBearingRangeSection ? (
                    <>
                        <Divider sx={{py: 0.5}}/>

                        <Typography sx={CONTEXT_MENU_SECTION_HEADING_SX}>
                            Bearing/Range Lines
                        </Typography>

                        {hasBearingRangeLine ? (
                            <Button
                                color='primary'
                                size='small'
                                variant='outlined'
                                onClick={() => onRemoveBearingRangeLine(elementContainer.line.id)}
                                sx={CONTEXT_MENU_BUTTON_SX}
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
                                sx={CONTEXT_MENU_BUTTON_SX}
                                fullWidth
                            >
                                Clear all lines
                            </Button>
                        ) : null}
                    </>
                ) : null}
            </Stack>
        </Paper>
    )
})

export default MapContextMenu
