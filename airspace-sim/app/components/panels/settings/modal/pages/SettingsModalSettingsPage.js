'use client'

import {
    Box,
    Divider,
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
} from '../../../../../contexts/AppSettingsContext'
import {DEFAULT_SIMULATION_SETTINGS} from '@/app/simulation/constants'
import {
    formatCoordinatePairForGridReferenceSystem,
} from '@/app/tools/formatting/GridReferenceFormatting'
import SettingsModalRestoreDefaultsSection from '../SettingsModalRestoreDefaultsSection'
import SettingsModalRestoreAllDefaultsSection from '../SettingsModalRestoreAllDefaultsSection'
import SettingsModalSimulationPage from './SettingsModalSimulationPage'

const GRID_REFERENCE_EXAMPLE_LAT = 38.8977
const GRID_REFERENCE_EXAMPLE_LNG = -77.0365

export default function SettingsModalSettingsPage() {
    const {
        appSettings,
        setGridReferenceSystem,
        updateAppSettings,
    } = useAppSettings()

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

            <Divider/>

            <SettingsModalSimulationPage/>

            <SettingsModalRestoreDefaultsSection
                label='Reset Settings Page'
                hint='Resets grid reference and simulation options on this page only. Other pages are unchanged.'
                onClick={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        gridReferenceSystem: DEFAULT_APP_SETTINGS.gridReferenceSystem,
                        showPerformanceOverlay: DEFAULT_APP_SETTINGS.showPerformanceOverlay,
                        ...DEFAULT_SIMULATION_SETTINGS,
                    }))
                }}
            />

            <SettingsModalRestoreAllDefaultsSection/>
        </Stack>
    )
}
