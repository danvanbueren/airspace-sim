'use client'

import {FormControl, MenuItem, Select} from '@mui/material'
import {GRID_REFERENCE_SYSTEMS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import {getGridReferenceSystemDisplayName} from '@/app/tools/formatting/GridReferenceFormatting'

export function getGridReferenceSystemMenuProps({disablePortal = true, zIndex} = {}) {
    return {
        disablePortal,
        slotProps: {
            paper: {
                sx: {
                    ...(zIndex !== undefined ? {zIndex: zIndex + 1} : {}),
                    '& .MuiMenuItem-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        minHeight: 28,
                        py: 0.25,
                    },
                },
            },
        },
    }
}

export default function GridReferenceSystemSelect({
    value,
    onChange,
    zIndex,
    disablePortal = true,
    disabled = false,
    matchInputHeight = false,
    matchedHeight,
    compact = false,
    sx,
}) {
    const {appSettings} = useAppSettings()
    const selectedValue = value ?? appSettings.gridReferenceSystem
    const shouldStretchInput = matchInputHeight || matchedHeight != null

    return (
        <FormControl
            size='small'
            disabled={disabled}
            variant='outlined'
            sx={{
                minWidth: compact ? '2.5rem' : '3rem',
                m: 0,
                ...(shouldStretchInput ? {
                    display: 'flex',
                    flexDirection: 'column',
                    ...(matchedHeight != null ? {height: matchedHeight} : {height: '100%'}),
                    '& .MuiInputBase-root': {
                        flex: 1,
                        minHeight: 0,
                        boxSizing: 'border-box',
                    },
                } : {}),
                ...sx,
            }}
        >
            <Select
                value={selectedValue}
                onChange={(event) => onChange?.(event.target.value)}
                size='small'
                sx={{
                    fontFamily: 'monospace',
                    fontSize: compact ? '0.65rem' : '0.75rem',
                    ...(compact ? {minWidth: '2.5rem'} : {}),
                    ...(shouldStretchInput ? {
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        alignItems: 'stretch',
                    } : {}),
                    '& .MuiOutlinedInput-notchedOutline legend': {
                        maxWidth: 0,
                    },
                    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
                        py: 0.5,
                        pl: 1,
                        paddingRight: '8px !important',
                        ...(shouldStretchInput ? {
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            boxSizing: 'border-box',
                        } : {}),
                    },
                    '& .MuiSelect-icon': {
                        display: 'none',
                    },
                }}
                MenuProps={getGridReferenceSystemMenuProps({disablePortal, zIndex})}
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
    )
}
