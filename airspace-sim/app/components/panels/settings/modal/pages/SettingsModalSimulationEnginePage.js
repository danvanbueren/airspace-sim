'use client'

import {Stack} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {DEFAULT_SIMULATION_SETTINGS} from '@/app/simulation/constants'
import SettingsModalRestoreDefaultsSection from '../SettingsModalRestoreDefaultsSection'
import SettingsModalRestoreAllDefaultsSection from '../SettingsModalRestoreAllDefaultsSection'
import SettingsModalSimulationPage from './SettingsModalSimulationPage'

export default function SettingsModalSimulationEnginePage() {
    const {updateAppSettings} = useAppSettings()

    return (
        <Stack spacing={3}>
            <SettingsModalSimulationPage/>

            <SettingsModalRestoreDefaultsSection
                label='Reset Simulation Engine Page'
                hint='Resets simulation options and quality settings on this page only. Other pages are unchanged.'
                onClick={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        ...DEFAULT_SIMULATION_SETTINGS,
                    }))
                }}
            />

            <SettingsModalRestoreAllDefaultsSection/>
        </Stack>
    )
}
