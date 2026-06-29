'use client'

import {useCallback} from 'react'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'
import {useFloatingDraggableStack} from '@/app/contexts/FloatingDraggableStackContext'
import {FLOATING_DRAGGABLE_IDS} from '@/app/constants/floatingDraggableIds'
import {MAX_ACTION_PANEL_COUNT} from '@/app/tools/actionPanels/actionPanelDefaults'
import {
    computeDrawToolsPanelPosition,
    createDrawToolsActionPanel,
} from '@/app/tools/actionPanels/drawToolsActionPanel'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {MISC_SIGNAL_ID} from '@/app/simulation/signalDefinitions'

export function useOpenDrawToolsPanel() {
    const {updateActionPanelsState} = useActionPanels()
    const {bringDraggableToFront} = useFloatingDraggableStack()
    const {raiseAlarmAlert} = useAlarmAlertActions()

    const openDrawToolsPanel = useCallback((elementContainer, mapContainerRef) => {
        if (!elementContainer) {
            return null
        }

        const layoutPosition = computeDrawToolsPanelPosition(elementContainer, mapContainerRef)
        let newPanelId = null

        updateActionPanelsState((currentState) => {
            if (currentState.panels.length >= MAX_ACTION_PANEL_COUNT) {
                raiseAlarmAlert({
                    signalId: MISC_SIGNAL_ID,
                    message: `Cannot open Draw Tools panel: maximum of ${MAX_ACTION_PANEL_COUNT} action panels reached.`,
                })
                return currentState
            }

            const {panel, layout} = createDrawToolsActionPanel(layoutPosition)
            newPanelId = panel.id

            return {
                panels: [...currentState.panels, panel],
                layouts: {
                    ...currentState.layouts,
                    [panel.id]: layout,
                },
            }
        })

        if (newPanelId) {
            requestAnimationFrame(() => {
                bringDraggableToFront(FLOATING_DRAGGABLE_IDS.actionPanel(newPanelId))
            })
        }

        return newPanelId
    }, [bringDraggableToFront, raiseAlarmAlert, updateActionPanelsState])

    return {openDrawToolsPanel}
}
