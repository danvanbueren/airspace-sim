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
    GRID_REFERENCE_SYSTEMS,
    useAppSettings,
} from '../../../../../contexts/AppSettingsContext'
import SettingsModalSimulationPage from './SettingsModalSimulationPage'

export default function SettingsModalSettingsPage() {
    const {
        appSettings,
        setGridReferenceSystem,
    } = useAppSettings()

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Grid Reference System
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Choose the coordinate/grid reference format used in the cursor tooltip,
                    context menu, and future map features.
                </Typography>

                <FormControl>
                    <FormLabel id='grid-reference-system-label'>
                        Display format
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
        </Stack>
    )
}