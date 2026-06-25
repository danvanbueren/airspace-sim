'use client'

import {useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {
    PERFORMANCE_BUDGET_LINE_COLOR,
    PERFORMANCE_HISTORY_LENGTH,
    PERFORMANCE_MAX_MARKER_COLOR,
    PERFORMANCE_MEASURED_FRAME_SEGMENTS,
} from '@/app/simulation/performanceFrameSegments'
import {getChartScaleMaxMs, getSampleMeasuredMs, msToPlotY} from '@/app/simulation/performanceChartScale'

const CHART_HEIGHT = 132
const PADDING = {
    top: 8,
    right: 8,
    bottom: 18,
    left: 34,
}

function drawYAxisLabels(context, {plotTop, plotHeight, scaleMaxMs, targetFrameMs, leftPadding}) {
    const budgetY = msToPlotY(targetFrameMs, {plotTop, plotHeight, scaleMaxMs})
    const bottomY = plotTop + plotHeight

    context.fillStyle = 'rgba(255, 255, 255, 0.55)'
    context.font = '10px monospace'
    context.textAlign = 'right'
    context.textBaseline = 'middle'
    context.fillText(String(targetFrameMs), leftPadding - 4, budgetY)
    context.textBaseline = 'bottom'
    context.fillText('0', leftPadding - 4, bottomY)
    context.textBaseline = 'top'
    context.fillText(String(Math.round(scaleMaxMs)), leftPadding - 4, plotTop)

    return budgetY
}

function drawBudgetLine(context, {plotWidth, budgetY, leftPadding}) {
    context.save()
    context.strokeStyle = PERFORMANCE_BUDGET_LINE_COLOR
    context.lineWidth = 1.5
    context.setLineDash([4, 4])
    context.beginPath()
    context.moveTo(leftPadding, budgetY)
    context.lineTo(leftPadding + plotWidth, budgetY)
    context.stroke()
    context.setLineDash([])
    context.restore()
}

function drawChart(context, metrics, width, height) {
    if (!context) {
        return
    }

    const plotTop = PADDING.top
    const plotWidth = width - PADDING.left - PADDING.right
    const plotHeight = height - PADDING.top - PADDING.bottom
    const history = metrics.history ?? []
    const targetFrameMs = metrics.targetFrameMs ?? 16.67
    const scaleMaxMs = getChartScaleMaxMs(history, targetFrameMs)
    const barSlotWidth = plotWidth / PERFORMANCE_HISTORY_LENGTH
    const historyStartIndex = PERFORMANCE_HISTORY_LENGTH - history.length
    const barWidth = Math.max(barSlotWidth - 1, 1)

    context.clearRect(0, 0, width, height)

    context.fillStyle = 'rgba(255, 255, 255, 0.08)'
    context.fillRect(PADDING.left, PADDING.top, plotWidth, plotHeight)

    const budgetY = drawYAxisLabels(context, {
        plotTop,
        plotHeight,
        scaleMaxMs,
        targetFrameMs,
        leftPadding: PADDING.left,
    })

    if (history.length === 0) {
        drawBudgetLine(context, {
            plotWidth,
            budgetY,
            leftPadding: PADDING.left,
        })

        context.fillStyle = 'rgba(255, 255, 255, 0.65)'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('Collecting frame samples…', PADDING.left + plotWidth / 2, PADDING.top + plotHeight / 2)
        return
    }

    history.forEach((sample, index) => {
        const columnIndex = historyStartIndex + index
        const x = PADDING.left + columnIndex * barSlotWidth
        let yOffset = plotTop + plotHeight

        PERFORMANCE_MEASURED_FRAME_SEGMENTS.forEach((segment) => {
            const segmentMs = sample[segment.key] ?? 0

            if (segmentMs <= 0) {
                return
            }

            const segmentHeight = (segmentMs / scaleMaxMs) * plotHeight

            yOffset -= segmentHeight
            context.fillStyle = segment.color
            context.fillRect(x, yOffset, barWidth, segmentHeight)
        })

        const peakMs = sample.maxMeasuredMs ?? getSampleMeasuredMs(sample)

        if (peakMs > 0) {
            const peakY = msToPlotY(peakMs, {plotTop, plotHeight, scaleMaxMs})

            context.strokeStyle = PERFORMANCE_MAX_MARKER_COLOR
            context.lineWidth = 2
            context.beginPath()
            context.moveTo(x + 0.5, peakY)
            context.lineTo(x + barWidth - 0.5, peakY)
            context.stroke()
            context.lineWidth = 1
        }
    })

    drawBudgetLine(context, {
        plotWidth,
        budgetY,
        leftPadding: PADDING.left,
    })

    context.fillStyle = 'rgba(255, 255, 255, 0.55)'
    context.font = '10px monospace'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.fillText('past → now', PADDING.left + plotWidth / 2, height - PADDING.bottom + 2)
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
                drawChart(context, metrics, width, CHART_HEIGHT)
            }
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
