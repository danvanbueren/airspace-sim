'use client'

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material'
import {
    DEFAULT_APP_SETTINGS,
    GRID_REFERENCE_SYSTEMS,
    useAppSettings,
} from '@/app/contexts/AppSettingsContext'
import {
    formatCoordinatePairForGridReferenceSystem,
} from '@/app/tools/formatting/GridReferenceFormatting'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'

const GRID_REFERENCE_EXAMPLE_LAT = 38.8977
const GRID_REFERENCE_EXAMPLE_LNG = -77.0365

export default function SettingsModalLookAndFeelPage() {
    const {appSettings, setGridReferenceSystem, updateAppSettings} = useAppSettings()

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Grid Reference System
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Coordinate format for the cursor tooltip and context menu.
                </Typography>

                <FormControl fullWidth size='small'>
                    <InputLabel id='grid-reference-system-label'>
                        Display Format
                    </InputLabel>
                    <Select
                        labelId='grid-reference-system-label'
                        label='Display Format'
                        value={appSettings.gridReferenceSystem}
                        onChange={(event) => setGridReferenceSystem(event.target.value)}
                    >
                        {Object.values(GRID_REFERENCE_SYSTEMS).map((system) => (
                            <MenuItem key={system.value} value={system.value}>
                                {system.label} — {system.description}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography
                    variant='caption'
                    color='text.secondary'
                    component='div'
                    sx={{display: 'block', mt: 1, fontFamily: 'monospace'}}
                >
                    Example:{' '}
                    {formatCoordinatePairForGridReferenceSystem(
                        GRID_REFERENCE_EXAMPLE_LAT,
                        GRID_REFERENCE_EXAMPLE_LNG,
                        appSettings.gridReferenceSystem,
                    ).join(' · ')}
                </Typography>
            </Box>

            <SettingsModalPageRestoreFooter
                pageLabel='Reset Look & Feel Page'
                pageHint='Resets grid reference settings on this page only.'
                onPageReset={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        gridReferenceSystem: DEFAULT_APP_SETTINGS.gridReferenceSystem,
                    }))
                }}
            />
        </Stack>
    )
}
