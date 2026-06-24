'use client'

import {forwardRef} from 'react'
import {
    Box,
    Button,
    Divider,
    FormControl,
    Grid,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography
} from '@mui/material'
import {useAppSettings, GRID_REFERENCE_SYSTEMS} from '@/app/contexts/AppSettingsContext'
import {
    formatCoordinatePairForGridReferenceSystem,
    getGridReferenceSystemDisplayName,
} from '@/app/tools/formatting/GridReferenceFormatting'
import {shouldShowDropAttention} from '@/app/simulation/trackAutoDrop'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

function getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const menuWidth = contextMenuSize.width
    const menuHeight = contextMenuSize.height

    let left = elementContainer.x
    let top = elementContainer.y

    if (menuWidth && left + menuWidth > containerWidth - edgePadding)
        left = elementContainer.x - menuWidth

    if (menuHeight && top + menuHeight > containerHeight - edgePadding)
        top = elementContainer.y - menuHeight

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

const MapContextMenu = forwardRef(function MapContextMenu({
                                                                  elementContainer,
                                                                  contextMenuSize,
                                                                  mapContainerRef,
                                                                  onInitiateTrack,
                                                                  onDropTrack,
                                                                  onRecoverTrack,
                                                                  onToggleDropProtect,
                                                                  onRemoveBearingRangeLine,
                                                                  onClearBearingRangeLines,
                                                                  lines,
                                                              }, ref) {
    const {appSettings, setGridReferenceSystem} = useAppSettings()

    if (!elementContainer) return null

    const hasBearingRangeLine = Boolean(elementContainer.line)
    const track = elementContainer.track ?? null
    const hasTrack = Boolean(track)
    const showRecoverTrack = hasTrack && shouldShowDropAttention(track)
    const dropProtectEnabled = Boolean(track?.dropProtect)
    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        elementContainer.lngLat.lat,
        elementContainer.lngLat.lng,
        appSettings.gridReferenceSystem,
    )

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'absolute',
                ...getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef),
                zIndex: UI_Z_INDEX.CONTEXT_MENU,
                width: 220,
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >

            <Box sx={{bgcolor: 'primary.main', p: 2}}>
                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace', color: 'primary.contrastText', fontSize: '0.9rem'}}>
                    Dynamic Context Menu
                </Typography>
            </Box>

            <Stack spacing={1} sx={{p: 2}}>
                <Grid container spacing={1} sx={{display: 'flex', alignItems: 'center'}}>
                    <Grid size='auto'>
                        <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                            Position
                        </Typography>
                    </Grid>
                    <Grid size='grow' sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <FormControl
                            variant="filled"
                            size="small"
                            sx={{
                                minWidth: '3rem',
                                m: 0,
                            }}
                        >
                            <Select
                                value={appSettings.gridReferenceSystem}
                                onChange={(event) => setGridReferenceSystem(event.target.value)}
                                variant='outlined'
                                size='small'
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
                                        py: 0.5,
                                        pl: 1,
                                        paddingRight: '8px !important',
                                    },
                                    '& .MuiSelect-icon': {
                                        display: 'none',
                                    },
                                }}
                                MenuProps={{
                                    disablePortal: true,
                                    slotProps: {
                                        paper: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.75rem',
                                                    minHeight: 28,
                                                    py: 0.25,
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                {Object.values(GRID_REFERENCE_SYSTEMS).map((gridReferenceSystem) => (
                                    <MenuItem
                                        key={gridReferenceSystem.value}
                                        value={gridReferenceSystem.value}
                                    >
                                        {getGridReferenceSystemDisplayName(gridReferenceSystem.value)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box>
                    {formattedCoordinates.map((coordinateLine) => (
                        <Typography
                            key={coordinateLine}
                            sx={{fontFamily: 'monospace', whiteSpace: 'pre', fontSize: '0.8rem'}}
                        >
                            {coordinateLine}
                        </Typography>
                    ))}
                </Box>

                <Divider sx={{py: 0.5}}/>

                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Actions
                </Typography>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => {}}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
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
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    fullWidth
                >
                    Initiate Track
                </Button>

                {showRecoverTrack && (
                    <Button
                        color='warning'
                        size='small'
                        variant='outlined'
                        onClick={() => onRecoverTrack(track)}
                        sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                        fullWidth
                    >
                        Recover Track
                    </Button>
                )}

                {hasTrack && (
                    <Button
                        color='warning'
                        size='small'
                        variant='outlined'
                        onClick={() => onDropTrack(track)}
                        sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                        fullWidth
                    >
                        Drop
                    </Button>
                )}

                {hasTrack && (
                    <Button
                        color='primary'
                        size='small'
                        variant='outlined'
                        onClick={() => onToggleDropProtect(track)}
                        sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                        fullWidth
                    >
                        {dropProtectEnabled ? 'Disable Drop Protect' : 'Enable Drop Protect'}
                    </Button>
                )}

                <Divider sx={{py: 0.5}}/>

                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Bearing/Range Lines
                </Typography>

                {hasBearingRangeLine && (<Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onRemoveBearingRangeLine(elementContainer.line.id)}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    fullWidth
                >
                    Clear line
                </Button>)}

                {!(hasBearingRangeLine && lines.length === 1) && (<Button
                    color='warning'
                    size='small'
                    variant='outlined'
                    onClick={onClearBearingRangeLines}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    disabled={lines.length < 1}
                    fullWidth
                >
                    Clear all lines
                </Button>)}
            </Stack>
        </Paper>)
})

export default MapContextMenu
