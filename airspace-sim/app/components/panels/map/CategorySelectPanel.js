'use client'

import {Divider, Grid, ToggleButton, ToggleButtonGroup} from '@mui/material'
import MapPanel from '@/app/components/panels/MapPanel'
import {useSensorDisplay} from '@/app/contexts/SensorDisplayContext'

const AVAILABLE_TOGGLES = [
    'IFF_CURRENT',
    'IFF_HISTORY',
    '-',
    'RADAR_CURRENT',
    'RADAR_HISTORY',
    '-',
    'AIRPORTS',
    'AIR_ROUTES',
]

export default function CategorySelectPanel() {
    const {activeToggles, setActiveDisplayToggles} = useSensorDisplay()

    const handleToggles = (event, newToggles) => {
        setActiveDisplayToggles(newToggles)
    }

    return (
        <MapPanel title='Category Select Panel'>

            <ToggleButtonGroup
                value={activeToggles}
                onChange={handleToggles}
            >
                <Grid
                    container
                    spacing={2}
                    style={{width: '100%'}}
                >
                    {AVAILABLE_TOGGLES.map((value, index) => (
                        <Grid
                            size={4}
                            key={'CSP_GRID' + value + '_' + index}
                        >
                            <ToggleButton
                                key={'CSP_TOGGLE_' + value + '_' + index}
                                value={value}
                                disabled={value === '-'}
                                color='success'
                                fullWidth
                                sx={{
                                    height: 80,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {value.replaceAll('_', ' ')}
                                </span>
                            </ToggleButton>
                        </Grid>
                    ))}
                </Grid>
            </ToggleButtonGroup>

        </MapPanel>
    )
}
