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
            hint='Resets every settings page to defaults, including simulation engine, look & feel, advanced options, keybinds, and alerts/attentions.'
            color='error'
            onClick={handleResetAll}
        />
    )
}
