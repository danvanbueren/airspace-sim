'use client'

import MapView from './components/map/MapView'
import {Box} from '@mui/material'
import DraggableFloatingOverlaysLayer from './components/panels/glass/DraggableFloatingOverlaysLayer'
import ClassificationBar from './components/global/ClassificationBar'
import SettingsController from '@/app/components/panels/settings/SettingsController'
import {useCallback, useRef, useState} from 'react'
import AlarmAlertPanel from '@/app/components/panels/glass/AlarmAlertPanel'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import ErrorForwarder, {ReactErrorForwardingBoundary} from '@/app/hooks/global/ErrorForwarder'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import usePrefetchLatestGithubCommit from '@/app/hooks/global/usePrefetchLatestGithubCommit'
import useSeedAlarmAlerts from '@/app/hooks/global/useSeedAlarmAlerts'

export default function Home() {

    usePrefetchLatestGithubCommit()
    useSeedAlarmAlerts()

    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [settingsPageId, setSettingsPageId] = useState(null)
    const [mapOverlayLayer, setMapOverlayLayer] = useState(null)
    const mapContainerRef = useRef(null)

    const setMapOverlayLayerRef = useCallback((element) => {
        setMapOverlayLayer(element)
    }, [])

    const openSettingsPage = useCallback((pageId) => {
        setSettingsPageId(pageId)
        setSettingsModalOpen(true)
    }, [])

    const handleSettingsModalClose = useCallback((open) => {
        setSettingsModalOpen(open)

        if (!open) {
            setSettingsPageId(null)
        }
    }, [])

    const glassPanelStyle = ({top, bottom, left, right, transform}) => ({
        position: 'absolute',
        top: top ?? null,
        right: right ?? null,
        left: left ?? null,
        bottom: bottom ?? null,
        transform: transform ?? null,
        zIndex: UI_Z_INDEX.GLASS_PANEL,
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
                        <DraggableFloatingOverlaysLayer
                            mapContainerRef={mapContainerRef}
                            interactionsEnabled={!settingsModalOpen}
                            onEditPanelSettings={() => openSettingsPage('actionPanels')}
                        />
                    </ReactErrorForwardingBoundary>

                    <Box style={glassPanelStyle({bottom: 20, left: '50%', transform: 'translateX(-50%)'})}>
                        <AlarmAlertPanel/>
                    </Box>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Settings controller">
                        <Box style={glassPanelStyle({top: 20, right: 20})}>
                            <SettingsController
                                modalOpen={settingsModalOpen}
                                setModalOpen={handleSettingsModalClose}
                                initialPageId={settingsPageId}
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
