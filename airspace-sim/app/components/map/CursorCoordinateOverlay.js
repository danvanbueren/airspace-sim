'use client'

import {getCursorBoxPosition} from '../../hooks/map/useCursorHooks'
import {Box} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {
    formatCoordinatePairForGridReferenceSystem,
} from '@/app/tools/formatting/GridReferenceFormatting'

export default function CursorCoordinateOverlay({
                                                        cursorInfo, cursorBoxRef, cursorBoxSize, mapContainerRef,
                                                    }) {
    const {appSettings} = useAppSettings()

    if (!cursorInfo) return null

    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        cursorInfo.lat,
        cursorInfo.lng,
        appSettings.gridReferenceSystem,
    )

    return (<Box
        ref={cursorBoxRef}
        style={{
            position: 'absolute', ...getCursorBoxPosition(cursorBoxSize, cursorInfo, mapContainerRef),
            zIndex: 1,
            padding: '6px 8px',
            borderRadius: 4,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            fontSize: 12,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            whiteSpace: 'pre',
            userSelect: 'none',
            backdropFilter: 'blur(10px)',
        }}
    >
        {formattedCoordinates.map((coordinateLine) => (
            <Box key={coordinateLine}>
                {coordinateLine}
            </Box>
        ))}
    </Box>)
}