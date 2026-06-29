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
    sx,
}) {
    const {appSettings} = useAppSettings()
    const selectedValue = value ?? appSettings.gridReferenceSystem

    return (
        <FormControl
            variant='filled'
            size='small'
            disabled={disabled}
            sx={{
                minWidth: '3rem',
                m: 0,
                ...(matchInputHeight ? {
                    height: '100%',
                    display: 'flex',
                    '& .MuiInputBase-root': {
                        height: '100%',
                        boxSizing: 'border-box',
                    },
                } : {}),
                ...sx,
            }}
        >
            <Select
                value={selectedValue}
                onChange={(event) => onChange?.(event.target.value)}
                variant='outlined'
                size='small'
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    ...(matchInputHeight ? {
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                    } : {}),
                    '& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input': {
                        py: 0.5,
                        pl: 1,
                        paddingRight: '8px !important',
                        ...(matchInputHeight ? {
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
