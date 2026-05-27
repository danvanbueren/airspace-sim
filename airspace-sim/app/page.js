'use client'

import MapView from './components/map/MapView'
import {Box} from '@mui/material'
import CategorySelectPanel from './components/panels/glass/CategorySelectPanel'
import FixedFunctionPanel from './components/panels/glass/FixedFunctionPanel'
import ClassificationBar from './components/global/ClassificationBar'
import SettingsController from '@/app/components/panels/settings/SettingsController'
import {useCallback, useState} from 'react'
import AlarmAlertPanel from '@/app/components/panels/glass/AlarmAlertPanel'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import ErrorForwarder, {ReactErrorForwardingBoundary} from '@/app/hooks/global/ErrorForwarder'
import {useMapState} from './contexts/MapStateContext'
import usePrefetchLatestGithubCommit from '@/app/hooks/global/usePrefetchLatestGithubCommit'

export default function Home() {

    usePrefetchLatestGithubCommit()

    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [mapOverlayLayer, setMapOverlayLayer] = useState(null)

    const setMapOverlayLayerRef = useCallback((element) => {
        setMapOverlayLayer(element)
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

    const {addAlarmAlert} = useMapState()

    return (
        <ErrorForwarder onError={addAlarmAlert}>
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
                        <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Map view">
                            <MapView
                                mapInteractionsEnabled={!settingsModalOpen}
                                mapOverlayLayer={mapOverlayLayer}
                            />
                        </ReactErrorForwardingBoundary>
                    </Box>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Category select panel">
                        <Box style={glassPanelStyle({top: 20, left: 20})}>
                            <CategorySelectPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Fixed function panel">
                        <Box style={glassPanelStyle({bottom: 20, left: 20})}>
                            <FixedFunctionPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <Box style={glassPanelStyle({bottom: 20, left: '50%', transform: 'translateX(-50%)'})}>
                        <AlarmAlertPanel/>
                    </Box>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Settings controller">
                        <Box style={glassPanelStyle({top: 20, right: 20})}>
                            <SettingsController
                                modalOpen={settingsModalOpen}
                                setModalOpen={setSettingsModalOpen}
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