'use client'

import { Divider, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useState } from 'react'
import BasicGlassPanel from './BasicGlassPanel'

export default function CategorySelectPanel() {

    // Define available toggles, store currently active toggles
    const availableToggles = ['IFF_CURRENT', 'IFF_HISTORY', '-', 'RADAR_CURRENT', 'RADAR_HISTORY', '-']
    const [currentToggles, setCurrentToggles] = useState([])

    // Handle toggle button press
    const handleToggles = (event, newToggles) => {
        setCurrentToggles(newToggles.filter((toggle) => toggle !== '-'))
    }

    return (
        <BasicGlassPanel title='Category Select Panel'>

            <ToggleButtonGroup
                value={currentToggles}
                onChange={handleToggles}
            >
                <Grid
                    container
                    spacing={2}
                    style={{width: '100%'}}
                >
                    {availableToggles.map((value, index) => (
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
                                    key={'CSP_TOGGLE_SPAN_' + value + '_' + index}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {value.replaceAll('_', ' ')}
                                </span>
                            </ToggleButton>
                        </Grid>
                    ))}
                </Grid>
            </ToggleButtonGroup>

            {/* TODO: Remove this (temp) */}
            {currentToggles.length !== 0 &&
                <>
                    <Divider orientation='horizontal' flexItem sx={{marginTop: 1.5, marginBottom: 1.5}} />
                    <span style={{fontFamily: 'monospace'}}>TODO: IMPLEMENT TOGGLES</span>
                    {currentToggles.map((value, index) => (
                        <span key={'tempCSP_' + value + '_' + index} style={{fontFamily: 'monospace', fontWeight: 'bold'}}>{value}</span>
                    ))}
                </>
            }
            {/* TODO: Remove this (temp) */}

        </BasicGlassPanel>
    )
}
