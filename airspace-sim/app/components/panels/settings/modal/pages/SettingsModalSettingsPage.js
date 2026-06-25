'use client'

import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material'
import {
    DEFAULT_APP_SETTINGS,
    GRID_REFERENCE_SYSTEMS,
    useAppSettings,
} from '../../../../../contexts/AppSettingsContext'
import {DEFAULT_SIMULATION_SETTINGS} from '@/app/simulation/constants'
import SettingsModalRestoreDefaultsSection from '../SettingsModalRestoreDefaultsSection'
import SettingsModalSimulationPage from './SettingsModalSimulationPage'

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

                <FormControl>
                    <FormLabel id='grid-reference-system-label'>
                        Display Format
                    </FormLabel>

                    <RadioGroup
                        aria-labelledby='grid-reference-system-label'
                        value={appSettings.gridReferenceSystem}
                        onChange={(event) => setGridReferenceSystem(event.target.value)}
                    >
                        {Object.values(GRID_REFERENCE_SYSTEMS).map((system) => (
                            <FormControlLabel
                                key={system.value}
                                value={system.value}
                                control={<Radio/>}
                                label={`${system.label} - ${system.description}`}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </Box>

            <SettingsModalSimulationPage/>

            <SettingsModalRestoreDefaultsSection
                label='Restore Default Settings'
                hint='Resets grid reference and simulation options on this page. Other tabs are unchanged.'
                onClick={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        gridReferenceSystem: DEFAULT_APP_SETTINGS.gridReferenceSystem,
                        showPerformanceOverlay: DEFAULT_APP_SETTINGS.showPerformanceOverlay,
                        ...DEFAULT_SIMULATION_SETTINGS,
                    }))
                }}
            />
        </Stack>
    )
}