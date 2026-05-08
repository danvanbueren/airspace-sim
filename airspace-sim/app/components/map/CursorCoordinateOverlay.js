'use client'

import { getCursorBoxPosition } from '../../hooks/useCursorHooks'
import { formatLatLong } from '../../tools/formatting/PrettyLatLong'

export default function CursorCoordinateOverlay({
                                                    cursorInfo,
                                                    cursorBoxRef,
                                                    cursorBoxSize,
                                                    mapContainerRef,
                                                }) {
    if (!cursorInfo)
        return null

    return (
        <div
            ref={cursorBoxRef}
            style={{
                position: 'absolute',
                ...getCursorBoxPosition(cursorBoxSize, cursorInfo, mapContainerRef),

                // Keep the overlay above the map canvas.
                zIndex: 1,

                padding: '6px 8px',
                borderRadius: 4,
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'monospace',

                // Let mouse events pass through the overlay to the map.
                pointerEvents: 'none',

                // Preserve spacing from the padded coordinate strings.
                whiteSpace: 'pre',
            }}
        >
            LAT: {formatLatLong(cursorInfo.lat)}
            <br />
            LNG: {formatLatLong(cursorInfo.lng)}
        </div>
    )
}