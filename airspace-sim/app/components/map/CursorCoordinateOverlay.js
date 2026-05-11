'use client'

import {getCursorBoxPosition} from '../../hooks/useCursorHooks'
import {formatLatLong} from '../../tools/formatting/PrettyLatLong'
import {Box} from "@mui/material";

export default function CursorCoordinateOverlay({
                                                    cursorInfo, cursorBoxRef, cursorBoxSize, mapContainerRef,
                                                }) {
    if (!cursorInfo) return null

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
        LAT: {formatLatLong(cursorInfo.lat)}
        <br/>
        LNG: {formatLatLong(cursorInfo.lng)}
    </Box>)
}