'use client'

import {
    Box,
    Checkbox,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import {
    getSignalsByKind,
    getSignalDefinition,
    SIGNAL_KIND,
} from '@/app/simulation/signalDefinitions'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'

function SignalInhibitTable({title, description, kind, inhibitedIds, onToggle}) {
    const signals = getSignalsByKind(kind)

    return (
        <Box>
            <Typography variant='h6' sx={{fontWeight: 'bold', mb: 0.5}}>
                {title}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                {description}
            </Typography>

            <TableContainer>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold'}}>Signal</TableCell>
                            <TableCell sx={{fontWeight: 'bold'}}>Description</TableCell>
                            <TableCell align='center' sx={{fontWeight: 'bold', width: 120}}>
                                Inhibit
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {signals.map((signal) => {
                            const inhibited = inhibitedIds.includes(signal.id)

                            return (
                                <TableRow key={signal.id} hover>
                                    <TableCell sx={{fontFamily: 'monospace', fontWeight: 'bold'}}>
                                        {signal.label}
                                    </TableCell>
                                    <TableCell>
                                        {signal.description}
                                    </TableCell>
                                    <TableCell align='center'>
                                        <Checkbox
                                            checked={inhibited}
                                            onChange={() => onToggle(signal.id)}
                                            inputProps={{
                                                'aria-label': `Inhibit ${signal.label}`,
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default function SettingsModalAlertsAttentionsPage() {
    const {appSettings, updateAppSettings} = useAppSettings()

    const inhibitedAttentions = appSettings.inhibitedAttentions ?? []
    const inhibitedAlerts = appSettings.inhibitedAlerts ?? []

    const toggleInhibitedSignal = (kind, signalId) => {
        const settingKey = kind === SIGNAL_KIND.ATTENTION ? 'inhibitedAttentions' : 'inhibitedAlerts'

        updateAppSettings((currentSettings) => {
            const nextValues = currentSettings[settingKey]?.includes(signalId)
                ? currentSettings[settingKey].filter((value) => value !== signalId)
                : [...(currentSettings[settingKey] ?? []), signalId]

            return {
                ...currentSettings,
                [settingKey]: nextValues,
            }
        })
    }

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant='body2' color='text.secondary'>
                    Track attentions appear on the scope beside affected tracks and in track
                    management windows. Alarm alerts populate the AlarmAlert panel. Inhibited
                    signals are suppressed from their respective displays.
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{display: 'block', mt: 1}}>
                    Fallback category: {getSignalDefinition('MISC').label}
                </Typography>
            </Box>

            <SignalInhibitTable
                title='Track Attentions'
                description='On-map attention flags pinned to the right of tracks.'
                kind={SIGNAL_KIND.ATTENTION}
                inhibitedIds={inhibitedAttentions}
                onToggle={(signalId) => toggleInhibitedSignal(SIGNAL_KIND.ATTENTION, signalId)}
            />

            <SignalInhibitTable
                title='Alarm Alerts'
                description='Messages shown in the AlarmAlert panel.'
                kind={SIGNAL_KIND.ALERT}
                inhibitedIds={inhibitedAlerts}
                onToggle={(signalId) => toggleInhibitedSignal(SIGNAL_KIND.ALERT, signalId)}
            />
        </Stack>
    )
}
