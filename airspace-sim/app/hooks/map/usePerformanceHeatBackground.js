'use client'

import {useEffect, useRef} from 'react'
import {
    PERFORMANCE_BACKGROUND_BLOB_COUNT,
    PERFORMANCE_HEAT_SMOOTHING_SECONDS,
    computePerformanceHeat,
    getPerformanceBackgroundCssVariables,
    smoothToward,
} from '@/app/tools/performance/performanceBackgroundPalette'

function applyCssVariables(element, variables) {
    Object.entries(variables).forEach(([name, value]) => {
        element.style.setProperty(name, value)
    })
}

export function usePerformanceHeatBackground({frameMs, peakFrameMs, enabled}) {
    const backgroundRef = useRef(null)
    const heatRef = useRef(0)
    const targetHeatRef = useRef(0)
    const animationFrameRef = useRef(null)
    const lastTimestampRef = useRef(null)
    const startedAtRef = useRef(0)
    const reduceMotionRef = useRef(false)

    useEffect(() => {
        targetHeatRef.current = computePerformanceHeat(frameMs, peakFrameMs)
    }, [frameMs, peakFrameMs])

    useEffect(() => {
        if (!enabled) {
            return undefined
        }

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const updateReduceMotion = () => {
            reduceMotionRef.current = motionQuery.matches
        }

        updateReduceMotion()
        motionQuery.addEventListener('change', updateReduceMotion)

        startedAtRef.current = performance.now()
        lastTimestampRef.current = startedAtRef.current

        const tick = (timestamp) => {
            animationFrameRef.current = requestAnimationFrame(tick)

            const backgroundElement = backgroundRef.current

            if (!backgroundElement) {
                return
            }

            const lastTimestamp = lastTimestampRef.current ?? timestamp
            const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
            lastTimestampRef.current = timestamp

            heatRef.current = smoothToward(
                heatRef.current,
                targetHeatRef.current,
                deltaSeconds,
                PERFORMANCE_HEAT_SMOOTHING_SECONDS,
            )

            const elapsedSeconds = (timestamp - startedAtRef.current) / 1000
            const variables = getPerformanceBackgroundCssVariables(
                heatRef.current,
                elapsedSeconds,
                reduceMotionRef.current,
            )

            applyCssVariables(backgroundElement, variables)
        }

        animationFrameRef.current = requestAnimationFrame(tick)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            motionQuery.removeEventListener('change', updateReduceMotion)
        }
    }, [enabled])

    return {
        backgroundRef,
        blobCount: PERFORMANCE_BACKGROUND_BLOB_COUNT,
    }
}
