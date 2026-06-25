'use client'

import {useCallback} from 'react'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useControlBindings} from '@/app/contexts/ControlBindingsContext'
import SettingsModalRestoreDefaultsSection from './SettingsModalRestoreDefaultsSection'

export default function SettingsModalRestoreAllDefaultsSection({onAfterReset}) {
    const {resetAppSettings} = useAppSettings()
    const {resetControlBindings} = useControlBindings()

    const handleResetAll = useCallback(() => {
        resetAppSettings()
        resetControlBindings()
        onAfterReset?.()
    }, [onAfterReset, resetAppSettings, resetControlBindings])

    return (
        <SettingsModalRestoreDefaultsSection
            label='Reset All Pages'
            hint='Resets every settings page and keybinds to defaults.'
            color='error'
            showDivider={false}
            onClick={handleResetAll}
        />
    )
}
