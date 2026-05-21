'use client'

import {useKeyboardCameraControls} from './useKeyboardCameraControls'
import {useMapCursor} from './useMapCursor'
import {useMapInteractionGuards} from './useMapInteractionGuards'
import {useMapResize} from './useMapResize'
import {useMapStyle} from './useMapStyle'
import {useRemappableMapDragPan} from './useRemappableMapDragPan'

export function useMapViewInteractions(mapRef, mapReady, mapInteractionsEnabled, mapStyle) {
    const interactionsEnabled = mapReady && mapInteractionsEnabled

    useMapStyle(mapRef, mapStyle)
    useKeyboardCameraControls(mapRef, interactionsEnabled)
    useRemappableMapDragPan(mapRef, interactionsEnabled)
    useMapCursor(mapRef, interactionsEnabled)
    useMapInteractionGuards(mapRef, interactionsEnabled)
    useMapResize(mapRef, mapReady)

    return interactionsEnabled
}