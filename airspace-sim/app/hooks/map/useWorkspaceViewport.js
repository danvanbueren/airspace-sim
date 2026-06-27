'use client'

import {useEffect, useRef, useState} from 'react'
import {
    WORKSPACE_RESIZE_IDLE_MS,
    WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS,
} from '@/app/constants/workspaceViewport'
import {getWorkspaceContainerSize} from '@/app/tools/map/workspaceContainerSize'

function sizesEqual(leftSize, rightSize) {
    return leftSize.width === rightSize.width && leftSize.height === rightSize.height
}

export function useWorkspaceViewport(containerRef) {
    const [size, setSize] = useState(() => getWorkspaceContainerSize(containerRef))
    const [isResizing, setIsResizing] = useState(false)
    const [resizeGeneration, setResizeGeneration] = useState(0)
    const [resizeLayoutTick, setResizeLayoutTick] = useState(0)
    const resizeIdleTimerRef = useRef(null)
    const layoutTickTimerRef = useRef(null)
    const lastLayoutTickAtRef = useRef(0)
    const isResizingRef = useRef(false)
    const latestSizeRef = useRef(size)

    useEffect(() => {
        let cancelled = false
        let frameRef = null

        const publishSize = (nextSize) => {
            latestSizeRef.current = nextSize
            setSize((currentSize) => (
                sizesEqual(currentSize, nextSize) ? currentSize : nextSize
            ))
        }

        const emitLayoutTick = () => {
            if (cancelled) {
                return
            }

            lastLayoutTickAtRef.current = performance.now()
            publishSize(latestSizeRef.current)
            setResizeLayoutTick((currentTick) => currentTick + 1)
        }

        const scheduleThrottledLayoutTick = () => {
            const elapsed = performance.now() - lastLayoutTickAtRef.current

            if (elapsed >= WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS) {
                emitLayoutTick()
                return
            }

            if (layoutTickTimerRef.current) {
                return
            }

            layoutTickTimerRef.current = setTimeout(() => {
                layoutTickTimerRef.current = null
                emitLayoutTick()
            }, WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS - elapsed)
        }

        const finishResize = () => {
            resizeIdleTimerRef.current = null
            isResizingRef.current = false
            setIsResizing(false)
            publishSize(latestSizeRef.current)
            setResizeGeneration((currentGeneration) => currentGeneration + 1)
        }

        const markResizeActive = () => {
            if (resizeIdleTimerRef.current) {
                clearTimeout(resizeIdleTimerRef.current)
            }

            resizeIdleTimerRef.current = setTimeout(finishResize, WORKSPACE_RESIZE_IDLE_MS)

            if (!isResizingRef.current) {
                isResizingRef.current = true
                setIsResizing(true)
                emitLayoutTick()
                return
            }

            scheduleThrottledLayoutTick()
        }

        const updateSize = () => {
            if (cancelled) {
                return
            }

            latestSizeRef.current = getWorkspaceContainerSize(containerRef)

            if (isResizingRef.current) {
                scheduleThrottledLayoutTick()
                return
            }

            publishSize(latestSizeRef.current)
        }

        const scheduleUpdate = () => {
            if (frameRef) {
                return
            }

            frameRef = requestAnimationFrame(() => {
                frameRef = null
                updateSize()
            })
        }

        const attachObservers = () => {
            if (cancelled) {
                return
            }

            const container = containerRef.current

            if (!container) {
                frameRef = requestAnimationFrame(attachObservers)
                return
            }

            latestSizeRef.current = getWorkspaceContainerSize(containerRef)
            publishSize(latestSizeRef.current)

            const resizeObserver = new ResizeObserver(scheduleUpdate)
            resizeObserver.observe(container)
            window.addEventListener('resize', scheduleUpdate)

            return () => {
                resizeObserver.disconnect()
                window.removeEventListener('resize', scheduleUpdate)
            }
        }

        const detachObservers = attachObservers()

        return () => {
            cancelled = true
            detachObservers?.()

            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }

            if (resizeIdleTimerRef.current) {
                clearTimeout(resizeIdleTimerRef.current)
                resizeIdleTimerRef.current = null
            }

            if (layoutTickTimerRef.current) {
                clearTimeout(layoutTickTimerRef.current)
                layoutTickTimerRef.current = null
            }

            isResizingRef.current = false
        }
    }, [containerRef])

    return {
        size,
        isResizing,
        resizeGeneration,
        resizeLayoutTick,
    }
}
