'use client'

import {useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {PERFORMANCE_FRAME_SEGMENTS} from '@/app/simulation/performanceFrameSegments'

const CHART_HEIGHT = 132
const PADDING = {
    top: 8,
    right: 8,
    bottom: 18,
    left: 34,
}

function drawChart(canvas, metrics) {
    const context = canvas.getContext('2d')

    if (!context) {
        return
    }

    const width = canvas.width
    const height = canvas.height
    const plotWidth = width - PADDING.left - PADDING.right
    const plotHeight = height - PADDING.top - PADDING.bottom
    const history = metrics.history ?? []
    const maxMs = Math.max(metrics.historyMaxMs ?? 16.67, metrics.targetFrameMs ?? 16.67, 1)

    context.clearRect(0, 0, width, height)

    context.fillStyle = 'rgba(255, 255, 255, 0.08)'
    context.fillRect(PADDING.left, PADDING.top, plotWidth, plotHeight)

    const budgetY = PADDING.top + plotHeight - ((metrics.targetFrameMs ?? 16.67) / maxMs) * plotHeight

    context.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    context.setLineDash([4, 4])
    context.beginPath()
    context.moveTo(PADDING.left, budgetY)
    context.lineTo(PADDING.left + plotWidth, budgetY)
    context.stroke()
    context.setLineDash([])

    context.fillStyle = 'rgba(255, 255, 255, 0.55)'
    context.font = '10px monospace'
    context.textAlign = 'right'
    context.textBaseline = 'middle'
    context.fillText(`${metrics.targetFrameMs ?? 16.67}`, PADDING.left - 4, budgetY)
    context.fillText('0', PADDING.left - 4, PADDING.top + plotHeight)
    context.fillText(String(Math.round(maxMs)), PADDING.left - 4, PADDING.top)

    if (history.length === 0) {
        context.fillStyle = 'rgba(255, 255, 255, 0.65)'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('Collecting frame samples…', PADDING.left + plotWidth / 2, PADDING.top + plotHeight / 2)
        return
    }

    const barWidth = Math.max(1, plotWidth / history.length)

    history.forEach((sample, index) => {
        const x = PADDING.left + index * barWidth
        let yOffset = PADDING.top + plotHeight

        PERFORMANCE_FRAME_SEGMENTS.forEach((segment) => {
            const segmentMs = sample[segment.key] ?? 0

            if (segmentMs <= 0) {
                return
            }

            const segmentHeight = (segmentMs / maxMs) * plotHeight

            yOffset -= segmentHeight
            context.fillStyle = segment.color
            context.fillRect(x, yOffset, Math.max(barWidth - 0.5, 1), segmentHeight)
        })
    })

    context.fillStyle = 'rgba(255, 255, 255, 0.55)'
    context.font = '10px monospace'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.fillText('history →', PADDING.left + plotWidth / 2, height - PADDING.bottom + 2)
}

export default function PerformanceFrameTimeChart({metrics}) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current

        if (!canvas || !container) {
            return undefined
        }

        const resize = () => {
            const width = Math.max(container.clientWidth, 1)
            const devicePixelRatio = window.devicePixelRatio || 1

            canvas.width = Math.floor(width * devicePixelRatio)
            canvas.height = Math.floor(CHART_HEIGHT * devicePixelRatio)
            canvas.style.width = `${width}px`
            canvas.style.height = `${CHART_HEIGHT}px`

            const context = canvas.getContext('2d')

            if (context) {
                context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
            }

            drawChart(canvas, metrics)
        }

        resize()

        const observer = new ResizeObserver(resize)
        observer.observe(container)

        return () => {
            observer.disconnect()
        }
    }, [metrics])

    return (
        <Box ref={containerRef} sx={{width: '100%'}}>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: CHART_HEIGHT,
                }}
            />
        </Box>
    )
}
