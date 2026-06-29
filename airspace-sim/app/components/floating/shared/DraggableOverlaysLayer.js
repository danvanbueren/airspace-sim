'use client'

import {Box} from '@mui/material'
import ActionPanel from '../actionPanels/ActionPanel'
import PerformanceAnalyticsOverlay from '@/app/components/map/PerformanceAnalyticsOverlay'
import DrawToolsPanel from '@/app/components/floating/drawTools/DrawToolsPanel'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'

export default function DraggableOverlaysLayer({
    interactionsEnabled = true,
    onEditPanelSettings,
}) {
    const {actionPanelsState} = useActionPanels()

    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                zIndex: UI_Z_INDEX.FLOATING_OVERLAY,
                pointerEvents: 'none',
                '& [data-floating-draggable]': {
                    pointerEvents: 'auto',
                },
            }}
        >
            <PerformanceAnalyticsOverlay/>

            <DrawToolsPanel interactionsEnabled={interactionsEnabled}/>

            {actionPanelsState.panels.map((panel) => (
                <ActionPanel
                    key={panel.id}
                    panel={panel}
                    layout={actionPanelsState.layouts[panel.id]}
                    interactionsEnabled={interactionsEnabled}
                    onEditPanelSettings={onEditPanelSettings}
                />
            ))}
        </Box>
    )
}
