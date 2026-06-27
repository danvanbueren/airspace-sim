'use client'

import {useRef} from 'react'
import {Box} from '@mui/material'
import ActionPanel from './ActionPanel'
import PerformanceAnalyticsOverlay from '@/app/components/map/PerformanceAnalyticsOverlay'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'

export default function DraggableFloatingOverlaysLayer({
    mapContainerRef,
    interactionsEnabled = true,
    onEditPanelSettings,
}) {
    const layerRef = useRef(null)
    const {actionPanelsState} = useActionPanels()

    return (
        <Box
            ref={layerRef}
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
                    mapContainerRef={layerRef}
                    interactionsEnabled={interactionsEnabled}
                    onEditPanelSettings={onEditPanelSettings}
                />
            ))}
        </Box>
    )
}
