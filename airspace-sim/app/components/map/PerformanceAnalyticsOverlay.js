'use client'

import {Box, Paper, Stack, Typography, Grid, Divider} from '@mui/material'
import {usePerformanceMetrics} from '@/app/contexts/PerformanceMonitorContext'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import {
    PERFORMANCE_BUDGET_LINE_COLOR,
    PERFORMANCE_MAX_MARKER_COLOR,
} from '@/app/simulation/performanceFrameSegments'
import PerformanceFrameTimeChart from './PerformanceFrameTimeChart'

const MONO_LABEL_SX = {
    fontFamily: 'monospace',
    fontSize: '0.68rem',
    lineHeight: 1.35,
}

function PeakMarkerLegendItem() {
    return (
        <Stack direction='row' spacing={0.75} sx={{alignItems: 'center'}}>
            <Box
                component='span'
                sx={{
                    display: 'inline-block',
                    width: 14,
                    borderTop: `2px solid ${PERFORMANCE_MAX_MARKER_COLOR}`,
                }}
            />
            <Typography component='span' sx={{...MONO_LABEL_SX, color: 'rgba(255, 255, 255, 0.88)'}}>
                Peak compute
            </Typography>
        </Stack>
    )
}

function BudgetLineLegendItem() {
    return (
        <Stack direction='row' spacing={0.75} sx={{alignItems: 'center'}}>
            <Box
                component='span'
                sx={{
                    display: 'inline-block',
                    width: 14,
                    borderTop: `2px dashed ${PERFORMANCE_BUDGET_LINE_COLOR}`,
                }}
            />
            <Typography component='span' sx={{...MONO_LABEL_SX, color: 'rgba(255, 255, 255, 0.88)'}}>
                60 fps budget
            </Typography>
        </Stack>
    )
}

function LegendItem({color, label}) {
    return (
        <Stack direction='row' spacing={0.75} sx={{alignItems: 'center'}}>
            <Box
                component='span'
                sx={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 0.5,
                    backgroundColor: color,
                }}
            />
            <Typography component='span' sx={{...MONO_LABEL_SX, color: 'rgba(255, 255, 255, 0.88)'}}>
                {label}
            </Typography>
        </Stack>
    )
}

function StatChip({label, value, warn = false, multiline = false}) {
    const valueColor = warn ? '#ffb74d' : 'rgba(255, 255, 255, 0.9)'

    if (multiline) {
        return (
            <Box sx={{minWidth: 0}}>
                <Typography
                    component='span'
                    sx={{
                        ...MONO_LABEL_SX,
                        display: 'block',
                        color: 'rgba(255, 255, 255, 0.72)',
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    component='span'
                    sx={{
                        ...MONO_LABEL_SX,
                        display: 'block',
                        color: valueColor,
                        fontWeight: 600,
                    }}
                >
                    {value}
                </Typography>
            </Box>
        )
    }

    return (
        <Typography
            component='span'
            sx={{
                ...MONO_LABEL_SX,
                color: valueColor,
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
        <Paper
            elevation={0}
            sx={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                zIndex: UI_Z_INDEX.MAP_OVERLAY,
                width: {xs: 300, sm: 380},
                maxWidth: 'calc(100% - 32px)',
                pointerEvents: 'none',
                userSelect: 'none',
                borderRadius: 1,
                p: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            }}
        >
            <Stack spacing={1.5}>
                <Typography
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#ffffff',
                    }}
                >
                    Performance Analytics
                </Typography>

                <Typography
                    component='div'
                    sx={{
                        fontSize: '0.64rem',
                    }}
                >
                    <Grid container spacing={0.5}>
                        <Grid size={3}>
                            <StatChip label='FPS:' value={metrics.fps} />
                        </Grid>

                        <Grid size={3}>
                            <StatChip label='Load:' value={metrics.loadFactor} warn={metrics.loadFactor < 0.85} />
                        </Grid>
                        <Grid size={6}>
                            <StatChip label='Tracks Displayed:' value={metrics.visibleTrackCount} />
                        </Grid>
                        <Grid size={6}>
                            <StatChip label='Frame Time:' value={metrics.frameMs + ' ms'} />
                        </Grid>
                        <Grid size={6}>
                            <StatChip label='Tracks Total:' value={metrics.firmTrackCount} />
                        </Grid>
                        
                    </Grid>
                </Typography>

                <Divider />

                <PerformanceFrameTimeChart metrics={metrics} />

                <Typography
                    component='div'
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.64rem',
                        lineHeight: 1.45,
                        color: 'rgba(255, 255, 255, 0.62)',
                    }}
                >
                    <Grid container spacing={0.5}>
                        <Grid size={6}>
                            <Box component='span'>
                                X: History (every 1s)
                            </Box>
                        </Grid>
                        <Grid size={6}>
                            <Box component='span'>
                            Y: Avg compute (ms)
                            </Box>
                        </Grid>
                    </Grid>
                </Typography>

                <Divider />

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 1,
                    }}
                >
                    {metrics.segments.map((segment) => (
                        <LegendItem
                            key={segment.key}
                            color={segment.color}
                            label={segment.label}
                        />
                    ))}
                    <PeakMarkerLegendItem />
                    <BudgetLineLegendItem />
                </Box>
            </Stack>
        </Paper>
    )
}
