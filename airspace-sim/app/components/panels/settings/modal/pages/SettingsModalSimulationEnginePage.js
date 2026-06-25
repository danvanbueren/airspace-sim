'use client'

import {Stack} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {DEFAULT_SIMULATION_SETTINGS} from '@/app/simulation/constants'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'
import SettingsModalSimulationPage from './SettingsModalSimulationPage'

export default function SettingsModalSimulationEnginePage() {
    const {updateAppSettings} = useAppSettings()

    return (
        <Stack spacing={3}>
            <SettingsModalSimulationPage/>

            <SettingsModalPageRestoreFooter
                pageLabel='Reset Simulation Engine Page'
                pageHint='Resets simulation settings on this page only.'
                onPageReset={() => {
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        ...DEFAULT_SIMULATION_SETTINGS,
                    }))
                }}
            />
        </Stack>
    )
}
