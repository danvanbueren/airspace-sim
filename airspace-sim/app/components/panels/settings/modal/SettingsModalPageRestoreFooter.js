'use client'

import {Divider, Stack} from '@mui/material'
import SettingsModalRestoreAllDefaultsSection from './SettingsModalRestoreAllDefaultsSection'
import SettingsModalRestoreDefaultsSection from './SettingsModalRestoreDefaultsSection'

export default function SettingsModalPageRestoreFooter({
    pageLabel,
    pageHint,
    onPageReset,
    onAfterResetAll,
}) {
    return (
        <Stack spacing={1}>
            <Divider/>
            <Stack spacing={1}>
                <SettingsModalRestoreDefaultsSection
                    label={pageLabel}
                    hint={pageHint}
                    onClick={onPageReset}
                    showDivider={false}
                />
                <SettingsModalRestoreAllDefaultsSection onAfterReset={onAfterResetAll}/>
            </Stack>
        </Stack>
    )
}
