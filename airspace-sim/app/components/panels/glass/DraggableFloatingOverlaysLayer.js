'use client'

import {Box} from '@mui/material'
import ActionPanel from './ActionPanel'
import PerformanceAnalyticsOverlay from '@/app/components/map/PerformanceAnalyticsOverlay'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'

export default function DraggableFloatingOverlaysLayer({
    workspaceContainerRef,
    mapContainerRef,
    interactionsEnabled = true,
    onEditPanelSettings,
}) {
    const {actionPanelsState} = useActionPanels()

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                '& [data-floating-draggable]': {
                    pointerEvents: 'auto',
                },
            }}
        >
            <PerformanceAnalyticsOverlay mapContainerRef={mapContainerRef}/>

            {actionPanelsState.panels.map((panel) => (
                <ActionPanel
                    key={panel.id}
                    panel={panel}
                    layout={actionPanelsState.layouts[panel.id]}
                    mapContainerRef={workspaceContainerRef}
                    interactionsEnabled={interactionsEnabled}
                    onEditPanelSettings={onEditPanelSettings}
                />
            ))}
        </Box>
    )
}
