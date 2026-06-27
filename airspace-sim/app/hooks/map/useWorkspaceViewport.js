'use client'

import {useEffect, useRef, useState} from 'react'
import {getWorkspaceContainerSize} from '@/app/tools/map/workspaceContainerSize'

const RESIZE_IDLE_MS = 150

function sizesEqual(leftSize, rightSize) {
    return leftSize.width === rightSize.width && leftSize.height === rightSize.height
}

export function useWorkspaceViewport(containerRef) {
    const [size, setSize] = useState(() => getWorkspaceContainerSize(containerRef))
    const [isResizing, setIsResizing] = useState(false)
    const [resizeGeneration, setResizeGeneration] = useState(0)
    const resizeIdleTimerRef = useRef(null)
    const isResizingRef = useRef(false)

    useEffect(() => {
        let cancelled = false
        let frameRef = null

        const markResizeActive = () => {
            if (!isResizingRef.current) {
                isResizingRef.current = true
                setIsResizing(true)
            }

            if (resizeIdleTimerRef.current) {
                clearTimeout(resizeIdleTimerRef.current)
            }

            resizeIdleTimerRef.current = setTimeout(() => {
                resizeIdleTimerRef.current = null
                isResizingRef.current = false
                setIsResizing(false)
                setResizeGeneration((currentGeneration) => currentGeneration + 1)
            }, RESIZE_IDLE_MS)
        }

        const updateSize = () => {
            if (cancelled) {
                return
            }

            const nextSize = getWorkspaceContainerSize(containerRef)

            setSize((currentSize) => (
                sizesEqual(currentSize, nextSize) ? currentSize : nextSize
            ))
            markResizeActive()
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

            updateSize()

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

            isResizingRef.current = false
        }
    }, [containerRef])

    return {
        size,
        isResizing,
        resizeGeneration,
    }
}
