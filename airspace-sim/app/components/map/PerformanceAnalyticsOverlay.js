'use client'

import {Box, Typography} from '@mui/material'
import {usePerformanceMetrics} from '@/app/contexts/PerformanceMonitorContext'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import PerformanceFrameTimeChart from './PerformanceFrameTimeChart'

function LegendItem({color, label}) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
            <Box
                sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 0.5,
                    backgroundColor: color,
                    flexShrink: 0,
                }}
            />
            <Typography
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    color: 'rgba(255, 255, 255, 0.88)',
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}

function StatChip({label, value, warn = false}) {
    return (
        <Typography
            sx={{
                fontFamily: 'monospace',
                fontSize: '0.68rem',
                color: warn ? '#ffb74d' : 'rgba(255, 255, 255, 0.9)',
                whiteSpace: 'nowrap',
            }}
        >
            {label} {value}
        </Typography>
    )
}

export default function PerformanceAnalyticsOverlay() {
    const {enabled, metrics} = usePerformanceMetrics()

    if (!enabled) {
        return null
    }

    const frameBudgetWarn = metrics.frameMs > metrics.targetFrameMs

    return (
        <Box
            sx={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                zIndex: UI_Z_INDEX.MAP_OVERLAY,
                width: {xs: 280, sm: 360},
                maxWidth: 'calc(100% - 32px)',
                pointerEvents: 'none',
                userSelect: 'none',
                borderRadius: 1,
                px: 1.25,
                py: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            }}
        >
            <Typography
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    mb: 0.75,
                }}
            >
                Performance Analytics
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1,
                }}
            >
                <StatChip label='FPS' value={metrics.fps} warn={frameBudgetWarn} />
                <StatChip label='Frame' value={`${metrics.frameMs} ms`} warn={frameBudgetWarn} />
                <StatChip label='Visible' value={metrics.visibleTrackCount} />
                <StatChip label='Firm' value={metrics.firmTrackCount} />
                <StatChip label='Load' value={metrics.loadFactor} warn={metrics.loadFactor < 0.85} />
            </Box>

            <PerformanceFrameTimeChart metrics={metrics} />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 0.75,
                    mt: 1,
                }}
            >
                {metrics.segments.map((segment) => (
                    <LegendItem
                        key={segment.key}
                        color={segment.color}
                        label={segment.label}
                    />
                ))}
            </Box>

            <Typography
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.64rem',
                    color: 'rgba(255, 255, 255, 0.62)',
                    mt: 0.75,
                }}
            >
                Y: frame time (ms) · X: recent frames · dashed line = 60 fps budget
            </Typography>
        </Box>
    )
}
