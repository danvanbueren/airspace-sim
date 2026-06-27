'use client'

import {useRef} from 'react'
import {Box} from '@mui/material'
import ActionPanel from './ActionPanel'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

export default function ActionPanelsLayer({
    interactionsEnabled = true,
    onEditPanelSettings,
}) {
    const mapContainerRef = useRef(null)
    const {actionPanelsState} = useActionPanels()

    return (
        <Box
            ref={mapContainerRef}
            sx={{
                position: 'absolute',
                inset: 0,
                zIndex: UI_Z_INDEX.GLASS_PANEL,
                pointerEvents: 'none',
                '& [data-action-panel]': {
                    pointerEvents: 'auto',
                },
            }}
        >
            {actionPanelsState.panels.map((panel) => (
                <ActionPanel
                    key={panel.id}
                    panel={panel}
                    layout={actionPanelsState.layouts[panel.id]}
                    mapContainerRef={mapContainerRef}
                    interactionsEnabled={interactionsEnabled}
                    onEditPanelSettings={onEditPanelSettings}
                />
            ))}
        </Box>
    )
}
