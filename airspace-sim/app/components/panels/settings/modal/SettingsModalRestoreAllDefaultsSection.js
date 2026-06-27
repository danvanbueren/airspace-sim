'use client'

import {useCallback} from 'react'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useControlBindings} from '@/app/contexts/ControlBindingsContext'
import SettingsModalRestoreDefaultsSection from './SettingsModalRestoreDefaultsSection'

export default function SettingsModalRestoreAllDefaultsSection({onAfterReset}) {
    const {resetAppSettings} = useAppSettings()
    const {resetControlBindings} = useControlBindings()
    const {resetActionPanelsState} = useActionPanels()

    const handleResetAll = useCallback(() => {
        resetAppSettings()
        resetControlBindings()
        resetActionPanelsState()
        onAfterReset?.()
    }, [onAfterReset, resetActionPanelsState, resetAppSettings, resetControlBindings])

    return (
        <SettingsModalRestoreDefaultsSection
            label='Reset All Pages'
            hint='Resets every settings page, keybinds, and action panels to defaults.'
            color='error'
            showDivider={false}
            onClick={handleResetAll}
        />
    )
}
