'use client'

import {
    Box,
    FormControlLabel,
    Stack,
    Switch,
    Typography,
} from '@mui/material'
import {DEFAULT_APP_SETTINGS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'

export default function SettingsModalAdvancedPage() {
    const {appSettings, updateSimulationSettings, updateAppSettings} = useAppSettings()

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Diagnostics
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Developer and diagnostic overlays for inspecting runtime performance.
                </Typography>

                <FormControlLabel
                    control={(
                        <Switch
                            checked={Boolean(appSettings.showPerformanceOverlay)}
                            onChange={(event) => updateSimulationSettings({
                                showPerformanceOverlay: event.target.checked,
                            })}
                        />
                    )}
                    label='Show performance analytics overlay'
                />
            </Box>

            <SettingsModalPageRestoreFooter
                pageLabel='Reset Advanced Page'
                pageHint='Resets advanced settings on this page only.'
                onPageReset={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        showPerformanceOverlay: DEFAULT_APP_SETTINGS.showPerformanceOverlay,
                    }))
                }}
            />
        </Stack>
    )
}
