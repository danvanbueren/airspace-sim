'use client'

import MapView from './components/map/MapView'
import {Box} from '@mui/material'
import CategorySelectPanel from './components/panels/glass/CategorySelectPanel'
import FixedFunctionPanel from './components/panels/glass/FixedFunctionPanel'
import ClassificationBar from './components/global/ClassificationBar'
import SettingsController from '@/app/components/panels/settings/SettingsController'
import {useState} from 'react'
import AlarmAlertPanel from '@/app/components/panels/glass/AlarmAlertPanel'
import ErrorForwarder, {ReactErrorForwardingBoundary} from '@/app/hooks/global/ErrorForwarder'
import {useMapState} from './contexts/MapStateContext'

export default function Home() {

    const [settingsModalOpen, setSettingsModalOpen] = useState(false)

    const boxStyle = ({top, bottom, left, right}) => {
        return {
            position: 'absolute',
            top: top ?? null,
            right: right ?? null,
            left: left ?? null,
            bottom: bottom ?? null,
            zIndex: 1,
        }
    }

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
                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Category select panel">
                        <Box style={boxStyle({top: 20, left: 20})}>
                            <CategorySelectPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Fixed function panel">
                        <Box style={boxStyle({bottom: 20, left: 20})}>
                            <FixedFunctionPanel/>
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <Box style={{ ...boxStyle({ bottom: 20, left: '50%' }), transform: 'translateX(-50%)' }}>
                        <AlarmAlertPanel/>
                    </Box>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Settings controller">
                        <Box style={boxStyle({top: 20, right: 20})}>
                            <SettingsController
                                modalOpen={settingsModalOpen}
                                setModalOpen={setSettingsModalOpen}
                            />
                        </Box>
                    </ReactErrorForwardingBoundary>

                    <ReactErrorForwardingBoundary onError={addAlarmAlert} name="Map view">
                        <MapView
                            mapInteractionsEnabled={!settingsModalOpen}
                        />
                    </ReactErrorForwardingBoundary>
                </Box>
                <ClassificationBar/>
            </Box>
        </ErrorForwarder>
    )
}