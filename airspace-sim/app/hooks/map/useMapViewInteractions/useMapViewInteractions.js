'use client'

import {useKeyboardCameraControls} from './useKeyboardCameraControls'
import {useMapCenterOnClick} from './useMapCenterOnClick'
import {useMapCursor} from './useMapCursor'
import {useMapInteractionGuards} from './useMapInteractionGuards'
import {useMapResize} from './useMapResize'
import {useMapStyle} from './useMapStyle'
import {useRemappableMapDragPan} from './useRemappableMapDragPan'

export function useMapViewInteractions(
    mapRef,
    mapReady,
    mapInteractionsEnabled,
    mapStyle,
    mapCreationStyle,
    mapCursor,
    keyboardCameraControlsEnabled = true,
) {
    const interactionsEnabled = mapReady && mapInteractionsEnabled
    const keyboardControlsEnabled = interactionsEnabled && keyboardCameraControlsEnabled

    useMapStyle(mapRef, mapStyle, mapCreationStyle, mapReady)
    useKeyboardCameraControls(mapRef, keyboardControlsEnabled)
    useRemappableMapDragPan(mapRef, interactionsEnabled, mapCursor)
    useMapCenterOnClick(mapRef, interactionsEnabled, keyboardControlsEnabled)
    useMapCursor(mapRef, interactionsEnabled, mapCursor)
    useMapInteractionGuards(mapRef, interactionsEnabled)
    useMapResize(mapRef, mapReady)

    return interactionsEnabled
}