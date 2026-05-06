'use client'

import FloatingGlassPanel from "./FloatingGlassPanel"
import { Divider, Grid, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useEffect, useState } from "react"

export default function FixedFunctionPanel() {

    // Define available toggles, store currently active toggles
    const availableToggles = ['ZOOM_IN', 'ZOOM_OUT', '-', 'CENTER_ON_E-3', '-', '-']
    const [currentToggles, setCurrentToggles] = useState([])

    // Handle toggle button press
    const handleToggles = (event, newToggles) => {
        setCurrentToggles(newToggles.filter((toggle) => toggle !== '-'))
    }

    return (
        <FloatingGlassPanel title='Fixed Function Panel'>

            {/* TODO: Remove this (temp) */}
            {currentToggles.length !== 0 &&
                <>
                    <span style={{fontFamily: 'monospace'}}>TODO: IMPLEMENT TOGGLES</span>
                    {currentToggles.map((value, index) => (
                        <span key={'tempFFP_' + value + '_' + index} style={{fontFamily: 'monospace', fontWeight: 'bold'}}>{value}</span>
                    ))}
                    <Divider orientation="horizontal" flexItem sx={{marginTop: 1.5, marginBottom: 1.5}} />
                </>
            }
            {/* TODO: Remove this (temp) */}

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
                            key={'FFP_GRID' + value + '_' + index}
                        >
                            <ToggleButton
                                key={'FFP_TOGGLE_' + value + '_' + index}
                                value={value}
                                disabled={value === '-'}
                                variant='contained' color='success'
                                fullWidth
                                sx={{
                                    height: 80,
                                }}
                            >
                                <span
                                    key={'FFP_TOGGLE_SPAN_' + value + '_' + index}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
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
        </FloatingGlassPanel>
    )
}
