'use client'

import {useMemo} from 'react'
import {Box, Chip, Link, Stack, Typography} from '@mui/material'
import {useControlBindings} from '@/app/contexts/ControlBindingsContext'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {buildControlReference} from '@/app/tools/settings/controlReference'
import {SETTINGS_PAGE_TITLES} from '../../settingsPageConfig'

export default function SettingsModalUsageGuidePage({onOpenSettingsPage}) {
    const {controlBindings} = useControlBindings()
    const {appSettings} = useAppSettings()

    const controlReferenceSections = useMemo(
        () => buildControlReference(controlBindings, {
            bearingRangeBehavior: appSettings.bearingRangeBehavior,
        }),
        [controlBindings, appSettings.bearingRangeBehavior],
    )

    return (
        <Stack spacing={3}>
            <Stack spacing={1}>
                <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                    Complete Control Reference
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Every map control combination, including fixed shortcuts that are not individually
                    rebindable today. To change bindings, open{' '}
                    <Link
                        component='button'
                        type='button'
                        onClick={() => onOpenSettingsPage?.('keybinds')}
                        sx={{verticalAlign: 'baseline'}}
                    >
                        {SETTINGS_PAGE_TITLES.keybinds}
                    </Link>
                    .
                </Typography>
            </Stack>

            {controlReferenceSections.map((section) => (
                <Box
                    key={section.title}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Typography sx={{fontWeight: 'bold', mb: 1.5}}>
                        {section.title}
                    </Typography>

                    <Stack spacing={1.5}>
                        {section.entries.map((entry) => (
                            <Box
                                key={`${section.title}-${entry.action}`}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr', md: '1fr auto',
                                    },
                                    gap: 1,
                                    alignItems: 'start',
                                }}
                            >
                                <Box>
                                    <Typography sx={{fontWeight: 'bold'}}>
                                        {entry.action}
                                    </Typography>
                                    {entry.notes && (
                                        <Typography variant='body2' color='text.secondary'>
                                            {entry.notes}
                                        </Typography>
                                    )}
                                </Box>

                                <Chip
                                    label={entry.combo}
                                    size='small'
                                    sx={{
                                        justifySelf: {
                                            xs: 'start', md: 'end',
                                        },
                                        maxWidth: '100%',
                                        height: 'auto',
                                        '& .MuiChip-label': {
                                            whiteSpace: 'normal',
                                            py: 0.5,
                                        },
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    )
}
