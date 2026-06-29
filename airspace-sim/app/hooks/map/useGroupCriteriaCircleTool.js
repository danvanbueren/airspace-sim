import {useCallback, useEffect, useRef, useState} from 'react'
import {
    keyMatchesBinding,
    useControlBindings,
} from '../../contexts/ControlBindingsContext'
import {
    bindingUsesCapsLock,
    resolveGroupCriteriaCircleVisible,
    resolveNextCapsLockActive,
} from '../../tools/map/groupCriteriaCircleToggle.js'
import {GROUP_CRITERIA_RADIUS_NM} from '../../tools/map/scopeCircleGeometry.js'
import {
    createScopeCircleOverlay,
    drawScopeCircleOnOverlay,
    removeScopeCircleOverlay,
    resizeScopeCircleOverlay,
} from '../../tools/map/scopeCirclePreviewCanvas.js'

export function useGroupCriteriaCircleTool(mapRef, enabled, {
    strokeColor = '#fff',
    radiusNm = GROUP_CRITERIA_RADIUS_NM,
    cursorInfo = null,
} = {}) {
    const {controlBindings} = useControlBindings()
    const toggleBindingKeys = controlBindings.scopeTool.toggleGroupCriteriaCircle
    const usesCapsLockBinding = bindingUsesCapsLock(toggleBindingKeys)

    const overlayRef = useRef(null)
    const strokeColorRef = useRef(strokeColor)
    const radiusNmRef = useRef(radiusNm)
    const cursorInfoRef = useRef(cursorInfo)
    const toggleBindingKeysRef = useRef(toggleBindingKeys)
    const capsLockActiveRef = useRef(false)
    const [capsLockActive, setCapsLockActive] = useState(false)
    const [alternateToggleActive, setAlternateToggleActive] = useState(false)

    strokeColorRef.current = strokeColor
    radiusNmRef.current = radiusNm
    cursorInfoRef.current = cursorInfo
    toggleBindingKeysRef.current = toggleBindingKeys
    capsLockActiveRef.current = capsLockActive

    const clearOverlay = useCallback(() => {
        removeScopeCircleOverlay(overlayRef.current)
        overlayRef.current = null
    }, [])

    const redrawCircle = useCallback(() => {
        const map = mapRef.current
        const overlay = overlayRef.current
        const currentCursorInfo = cursorInfoRef.current

        if (!map || !overlay || !currentCursorInfo) {
            return
        }

        resizeScopeCircleOverlay(map, overlay)
        drawScopeCircleOnOverlay(
            map,
            overlay,
            currentCursorInfo.lng,
            currentCursorInfo.lat,
            strokeColorRef.current,
            radiusNmRef.current,
        )
    }, [mapRef])

    const isCircleVisible = resolveGroupCriteriaCircleVisible({
        usesCapsLockBinding,
        capsLockActive,
        alternateToggleActive,
    })

    useEffect(() => {
        if (!enabled) {
            setCapsLockActive(false)
            setAlternateToggleActive(false)
            clearOverlay()
            return undefined
        }

        setAlternateToggleActive(false)

        const syncCapsLockState = (event) => {
            if (!bindingUsesCapsLock(toggleBindingKeysRef.current)) {
                return
            }

            setCapsLockActive((previousActive) => {
                const nextActive = resolveNextCapsLockActive(
                    previousActive,
                    event,
                    toggleBindingKeysRef.current,
                )

                return previousActive === nextActive ? previousActive : nextActive
            })
        }

        const handleAlternateToggle = (event) => {
            if (bindingUsesCapsLock(toggleBindingKeysRef.current)) {
                return
            }

            if (!keyMatchesBinding(event.key, toggleBindingKeysRef.current)) {
                return
            }

            setAlternateToggleActive((previous) => !previous)
        }

        const handleKeyDown = (event) => {
            syncCapsLockState(event)
            handleAlternateToggle(event)
        }

        const handleKeyUp = (event) => {
            syncCapsLockState(event)
        }

        const handlePointerEvent = (event) => {
            syncCapsLockState(event)
        }

        const handleFocus = (event) => {
            syncCapsLockState(event)
        }

        window.addEventListener('keydown', handleKeyDown, true)
        window.addEventListener('keyup', handleKeyUp, true)
        window.addEventListener('pointermove', handlePointerEvent, {capture: true, passive: true})
        window.addEventListener('pointerdown', handlePointerEvent, true)
        window.addEventListener('focus', handleFocus)

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true)
            window.removeEventListener('keyup', handleKeyUp, true)
            window.removeEventListener('pointermove', handlePointerEvent, true)
            window.removeEventListener('pointerdown', handlePointerEvent, true)
            window.removeEventListener('focus', handleFocus)
        }
    }, [enabled, clearOverlay, usesCapsLockBinding, toggleBindingKeys])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            clearOverlay()
            return undefined
        }

        const map = mapRef.current

        const handleViewChange = () => {
            if (!resolveGroupCriteriaCircleVisible({
                usesCapsLockBinding: bindingUsesCapsLock(toggleBindingKeysRef.current),
                capsLockActive: capsLockActiveRef.current,
                alternateToggleActive,
            })) {
                return
            }

            redrawCircle()
        }

        map.on('move', handleViewChange)
        map.on('zoom', handleViewChange)
        map.on('resize', handleViewChange)

        return () => {
            map.off('move', handleViewChange)
            map.off('zoom', handleViewChange)
            map.off('resize', handleViewChange)
        }
    }, [enabled, alternateToggleActive, capsLockActive, usesCapsLockBinding, mapRef, redrawCircle, clearOverlay])

    useEffect(() => {
        if (!enabled || !mapRef.current || !isCircleVisible) {
            clearOverlay()
            return
        }

        const map = mapRef.current

        if (!overlayRef.current) {
            overlayRef.current = createScopeCircleOverlay(map)
        }

        if (!cursorInfoRef.current) {
            clearOverlay()
            return
        }

        redrawCircle()
    }, [
        enabled,
        isCircleVisible,
        cursorInfo,
        strokeColor,
        radiusNm,
        mapRef,
        redrawCircle,
        clearOverlay,
    ])

    useEffect(() => () => {
        clearOverlay()
    }, [clearOverlay])

    return {
        isGroupCriteriaCircleVisible: isCircleVisible,
    }
}
