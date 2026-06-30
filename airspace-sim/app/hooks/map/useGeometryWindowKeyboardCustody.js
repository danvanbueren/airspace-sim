'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {blurFocusedElementWithin} from '@/app/tools/browser/blurFocusedElementWithin'

export function useGeometryWindowKeyboardCustody({geometryWindows, bringGeometryWindowToFront}) {
    const [geometryKeyboardCustodyWindowId, setGeometryKeyboardCustodyWindowId] = useState(null)
    const geometryKeyboardCustodyWindowIdRef = useRef(null)
    const geometryWindowRefs = useRef(new Map())

    useEffect(() => {
        geometryKeyboardCustodyWindowIdRef.current = geometryKeyboardCustodyWindowId
    }, [geometryKeyboardCustodyWindowId])

    const registerGeometryWindowElement = useCallback((windowId, element) => {
        if (element) {
            geometryWindowRefs.current.set(windowId, element)
            return
        }

        geometryWindowRefs.current.delete(windowId)
    }, [])

    const releaseGeometryKeyboardCustody = useCallback(() => {
        const custodyWindowId = geometryKeyboardCustodyWindowIdRef.current

        if (custodyWindowId) {
            blurFocusedElementWithin(geometryWindowRefs.current.get(custodyWindowId))
        }

        setGeometryKeyboardCustodyWindowId(null)
    }, [])

    const claimGeometryKeyboardCustody = useCallback((windowId) => {
        const previousCustodyWindowId = geometryKeyboardCustodyWindowIdRef.current

        if (previousCustodyWindowId && previousCustodyWindowId !== windowId) {
            blurFocusedElementWithin(geometryWindowRefs.current.get(previousCustodyWindowId))
        }

        bringGeometryWindowToFront(windowId)
        setGeometryKeyboardCustodyWindowId(windowId)
    }, [bringGeometryWindowToFront])

    const closeGeometryWindowWithBlur = useCallback((windowId, onClose) => {
        blurFocusedElementWithin(geometryWindowRefs.current.get(windowId))
        setGeometryKeyboardCustodyWindowId((currentWindowId) => (
            currentWindowId === windowId ? null : currentWindowId
        ))
        onClose(windowId)
    }, [])

    const clearKeyboardCustodyForShape = useCallback((shapeId) => {
        setGeometryKeyboardCustodyWindowId((currentWindowId) => {
            if (!currentWindowId) {
                return null
            }

            const custodyWindow = geometryWindows.find((window) => window.id === currentWindowId)

            return custodyWindow?.shapeId === shapeId ? null : currentWindowId
        })
    }, [geometryWindows])

    return {
        geometryKeyboardCustodyWindowId,
        registerGeometryWindowElement,
        releaseGeometryKeyboardCustody,
        claimGeometryKeyboardCustody,
        closeGeometryWindowWithBlur,
        clearKeyboardCustodyForShape,
    }
}
