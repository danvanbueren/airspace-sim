'use client'

import MapView from './components/map/MapView'
import {Box} from '@mui/material'
import DraggableOverlaysLayer from './components/floating/shared/DraggableOverlaysLayer'
import ClassificationBar from './components/global/ClassificationBar'
import SettingsController from '@/app/components/panels/settings/SettingsController'
import {useCallback, useRef, useState} from 'react'
import AlarmAlertPanel from '@/app/components/floating/alerts/AlarmAlertPanel'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import ErrorForwarder, {ReactErrorForwardingBoundary} from '@/app/components/global/ErrorForwarder'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import usePrefetchLatestGithubCommit from '@/app/hooks/global/usePrefetchLatestGithubCommit'
import useSeedAlarmAlerts from '@/app/hooks/global/useSeedAlarmAlerts'

export default function Home() {

    usePrefetchLatestGithubCommit()
    useSeedAlarmAlerts()

    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [settingsPageId, setSettingsPageId] = useState(null)
    const [focusedActionPanelId, setFocusedActionPanelId] = useState(null)
    const [mapOverlayLayer, setMapOverlayLayer] = useState(null)
    const mapContainerRef = useRef(null)
    const workspaceContainerRef = useRef(null)

    const setMapOverlayLayerRef = useCallback((element) => {
        setMapOverlayLayer(element)
    }, [])

    const openSettingsPage = useCallback((pageId) => {
        setSettingsPageId(pageId)
        setSettingsModalOpen(true)
    }, [])

    const handleEditActionPanelSettings = useCallback((panelId) => {
        setFocusedActionPanelId(panelId)
        openSettingsPage('actionPanels')
    }, [openSettingsPage])

    const handleSettingsModalClose = useCallback((open) => {
        setSettingsModalOpen(open)

        if (!open) {
            setSettingsPageId(null)
            setFocusedActionPanelId(null)
        }
    }, [])

    const floatingPanelStyle = ({top, bottom, left, right, transform, zIndex}) => ({
        position: 'absolute',
        top: top ?? null,
        right: right ?? null,
        left: left ?? null,
        bottom: bottom ?? null,
        transform: transform ?? null,
        zIndex: zIndex ?? UI_Z_INDEX.FLOATING_OVERLAY,
    })

    const {raiseAlarmAlert} = useAlarmAlertActions()

    return (
        <ErrorForwarder onError={raiseAlarmAlert}>
            <Box
                sx={{
                    display: 'flex', flexDirection: 'column', height: '100dvh',
                }}
            >
                <ClassificationBar/>
                <Box
                    ref={workspaceContainerRef}
                    style={{
                        position: 'relative', width: '100dvw', flexGrow: 1, overflow: 'hidden', margin: 0, padding: 0,
                    }}
                >
                    <Box
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: UI_Z_INDEX.MAP,
                        }}
                    >
                        <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Map view">
                            <MapView
                                mapContainerRef={mapContainerRef}
                                mapInteractionsEnabled={!settingsModalOpen}
                                mapOverlayLayer={mapOverlayLayer}
                            />
                        </ReactErrorForwardingBoundary>
                    </Box>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Action panels">
                        <DraggableOverlaysLayer
                            workspaceContainerRef={workspaceContainerRef}
                            mapContainerRef={mapContainerRef}
                            interactionsEnabled={!settingsModalOpen}
                            onEditPanelSettings={handleEditActionPanelSettings}
                        />
                    </ReactErrorForwardingBoundary>

                    <Box style={floatingPanelStyle({bottom: 20, left: '50%', transform: 'translateX(-50%)'})}>
                        <AlarmAlertPanel/>
                    </Box>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Settings controller">
                        <Box style={floatingPanelStyle({top: 20, right: 20, zIndex: UI_Z_INDEX.SETTINGS_TOOLBELT})}>
                            <SettingsController
                                modalOpen={settingsModalOpen}
                                setModalOpen={handleSettingsModalClose}
                                initialPageId={settingsPageId}
                                focusedActionPanelId={focusedActionPanelId}
                            />
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <Box
                        ref={setMapOverlayLayerRef}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: UI_Z_INDEX.TRACK_MANAGEMENT_WINDOW_BASE,
                            pointerEvents: 'none',
                        }}
                    />
                </Box>
                <ClassificationBar/>
            </Box>
        </ErrorForwarder>
    )
}
