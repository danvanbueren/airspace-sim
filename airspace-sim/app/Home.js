'use client'

import MapView from './components/map/MapView'
import {Box} from '@mui/material'
import CategorySelectPanel from './components/panels/map/CategorySelectPanel'
import FixedFunctionPanel from './components/panels/map/FixedFunctionPanel'
import ClassificationBar from './components/global/ClassificationBar'
import SettingsController from '@/app/components/panels/settings/SettingsController'
import {useCallback, useState} from 'react'
import AlarmAlertPanel from '@/app/components/panels/alerts/AlarmAlertPanel'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import ErrorForwarder, {ReactErrorForwardingBoundary} from '@/app/components/global/ErrorForwarder'
import {useAlarmAlertActions} from '@/app/hooks/alerts/useAlarmAlertActions'
import usePrefetchLatestGithubCommit from '@/app/hooks/global/usePrefetchLatestGithubCommit'
import useSeedAlarmAlerts from '@/app/hooks/alerts/useSeedAlarmAlerts'

export default function Home() {

    usePrefetchLatestGithubCommit()
    useSeedAlarmAlerts()

    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [mapOverlayLayer, setMapOverlayLayer] = useState(null)

    const setMapOverlayLayerRef = useCallback((element) => {
        setMapOverlayLayer(element)
    }, [])

    const mapPanelStyle = ({top, bottom, left, right, transform}) => ({
        position: 'absolute',
        top: top ?? null,
        right: right ?? null,
        left: left ?? null,
        bottom: bottom ?? null,
        transform: transform ?? null,
        zIndex: UI_Z_INDEX.MAP_PANEL,
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
                                mapInteractionsEnabled={!settingsModalOpen}
                                mapOverlayLayer={mapOverlayLayer}
                            />
                        </ReactErrorForwardingBoundary>
                    </Box>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Category select panel">
                        <Box style={mapPanelStyle({top: 20, left: 20})}>
                            <CategorySelectPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Fixed function panel">
                        <Box style={mapPanelStyle({bottom: 20, left: 20})}>
                            <FixedFunctionPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <Box style={mapPanelStyle({bottom: 20, left: '50%', transform: 'translateX(-50%)'})}>
                        <AlarmAlertPanel/>
                    </Box>

                    <ReactErrorForwardingBoundary onError={raiseAlarmAlert} name="Settings controller">
                        <Box style={mapPanelStyle({top: 20, right: 20})}>
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
