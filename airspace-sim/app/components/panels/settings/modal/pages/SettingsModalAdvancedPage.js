'use client'

import {
    Box,
    FormControlLabel,
    Stack,
    Switch,
    Typography,
} from '@mui/material'
import {DEFAULT_APP_SETTINGS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import {
    DEFAULT_CONTROL_BINDINGS,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import {BEARING_RANGE_SENSITIVITY_FIELDS} from '@/app/tools/settings/bearingRangeSensitivityFields'

function toFiniteNumber(value, fallbackValue) {
    const numericValue = Array.isArray(value) ? value[0] : value
    const parsed = Number(numericValue)
    return Number.isFinite(parsed) ? parsed : fallbackValue
}

export default function SettingsModalAdvancedPage() {
    const {appSettings, updateSimulationSettings, updateAppSettings} = useAppSettings()
    const {controlBindings, updateControlBindings} = useControlBindings()
    const bearingRangeTool = controlBindings.bearingRangeTool

    const updateBearingRangeBinding = (bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings,
            bearingRangeTool: {
                ...currentBindings.bearingRangeTool,
                [bindingKey]: toFiniteNumber(nextValue, currentBindings.bearingRangeTool[bindingKey]),
            },
        }))
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Line and Context Menu Sensitivity
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Timing and distance limits for context menu clicks and bearing/range draws.
                </Typography>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr', md: '1fr 1fr 1fr',
                        },
                        gap: 2,
                    }}
                >
                    {BEARING_RANGE_SENSITIVITY_FIELDS.map((field) => (
                        <DeferredTextField
                            key={field.key}
                            label={field.label}
                            type='text'
                            inputMode='numeric'
                            committedValue={bearingRangeTool[field.key]}
                            onCommit={(value) => updateBearingRangeBinding(field.key, value)}
                            formatCommitted={field.formatCommitted}
                            getDraftError={field.getDraftError}
                            parseDraft={field.parseDraft}
                            helperText={field.helperText}
                            fullWidth
                        />
                    ))}
                </Box>
            </Box>

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
                    updateControlBindings((currentBindings) => ({
                        ...currentBindings,
                        bearingRangeTool: {
                            ...currentBindings.bearingRangeTool,
                            contextMenuMaxMs: DEFAULT_CONTROL_BINDINGS.bearingRangeTool.contextMenuMaxMs,
                            contextMenuMaxPixels: DEFAULT_CONTROL_BINDINGS.bearingRangeTool.contextMenuMaxPixels,
                            minPersistedLinePixels: DEFAULT_CONTROL_BINDINGS.bearingRangeTool.minPersistedLinePixels,
                        },
                    }))
                }}
            />
        </Stack>
    )
}
