'use client'

import {useRef} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {Box, Card, Divider, Grid, IconButton, Stack, Typography} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {usePerformanceMetrics} from '@/app/contexts/PerformanceMonitorContext'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'
import {
    MAP_GLASS_INSET_PX,
    MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
} from '@/app/constants/mapUiLayout'
import {
    GLASS_PANEL_BORDER_STYLE,
    getGlassPanelSurfaceSx,
} from '@/app/components/panels/glass/glassPanelSurface'
import {usePerformanceAnalyticsOverlayDrag} from '@/app/hooks/map/usePerformanceAnalyticsOverlayDrag'
import {
    PERFORMANCE_50FPS_BUDGET_MS,
    PERFORMANCE_AVERAGE_MARKER_COLORS,
    PERFORMANCE_BUDGET_LINE_COLOR,
    PERFORMANCE_TARGET_FRAME_MS,
} from '@/app/simulation/performanceFrameSegments'
import PerformanceFrameTimeChart from './PerformanceFrameTimeChart'
import FpsStatChip from './FpsStatChip'
import FrameMsStatChip from './FrameMsStatChip'

const MONO_LABEL_SX = {
    fontFamily: 'monospace',
    fontSize: '0.68rem',
    lineHeight: 1.35,
}

function LineLegendItem({color, label, dashed = false}) {
    return (
        <Stack direction='row' spacing={0.75} sx={{alignItems: 'center'}}>
            <Box
                component='span'
                sx={{
                    display: 'inline-block',
                    width: dashed ? 14 : 12,
                    borderTop: dashed
                        ? `2px dashed ${color}`
                        : `2.75px solid ${color}`,
                    borderRadius: dashed ? 0 : 1,
                    boxShadow: dashed
                        ? undefined
                        : `0 0 0 1px rgba(0, 0, 0, 0.85), 0 0 0 2px rgba(255, 255, 255, 0.35)`,
                }}
            />
            <Typography component='span' sx={{...MONO_LABEL_SX, color: 'rgba(255, 255, 255, 0.88)'}}>
                {label}
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

export default function PerformanceAnalyticsOverlay({mapContainerRef}) {
    const {updateSimulationSettings} = useAppSettings()
    const {enabled, metrics} = usePerformanceMetrics()
    const overlayRef = useRef(null)

    const {
        position,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
    } = usePerformanceAnalyticsOverlayDrag({
        mapContainerRef,
        overlayRef,
        enabled,
    })

    if (!enabled) {
        return null
    }

    return (
        <Card
            ref={overlayRef}
            data-performance-analytics-overlay
            variant='outlined'
            onPointerDown={handlePanelPointerDown}
            style={GLASS_PANEL_BORDER_STYLE}
            sx={(theme) => ({
                ...getGlassPanelSurfaceSx(theme),
                position: 'absolute',
                ...(position
                    ? {
                        left: position.left,
                        top: position.top,
                    }
                    : {
                        right: MAP_GLASS_INSET_PX,
                        bottom: MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
                        visibility: 'hidden',
                    }),
                zIndex: UI_Z_INDEX.MAP_OVERLAY,
                width: {xs: 300, sm: 380},
                maxWidth: `calc(100% - ${MAP_GLASS_INSET_PX * 2}px)`,
                pointerEvents: 'auto',
                cursor: 'default',
                userSelect: 'none',
                overflow: 'hidden',
            })}
        >
            <Box
                onPointerDown={handleDragHandlePointerDown}
                onPointerMove={handleDragHandlePointerMove}
                onPointerUp={handleDragHandlePointerUp}
                onPointerCancel={handleDragHandlePointerUp}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 2.5,
                    cursor: 'grab',
                    touchAction: 'none',
                    '&:active': {
                        cursor: 'grabbing',
                    },
                }}
            >
                <DragIndicatorIcon
                    aria-hidden
                    sx={{
                        color: 'rgba(255, 255, 255, 0.55)',
                        fontSize: '1rem',
                    }}
                />
                <Typography
                    sx={{
                        flexGrow: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#ffffff',
                    }}
                >
                    Performance Analytics
                </Typography>
                <IconButton
                    aria-label='Close performance analytics overlay'
                    size='small'
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        updateSimulationSettings({showPerformanceOverlay: false})
                    }}
                    sx={{
                        color: 'rgba(255, 255, 255, 0.72)',
                        p: 0.25,
                        cursor: 'pointer',
                    }}
                >
                    <CloseIcon fontSize='small' />
                </IconButton>
            </Box>

            <Stack spacing={1.5} sx={{px: 2, pb: 2}}>

                <Typography
                    component='div'
                    sx={{
                        fontSize: '0.64rem',
                    }}
                >
                    <Grid container spacing={0.5}>
                        <Grid size={6}>
                            <FpsStatChip
                                lowFps={metrics.lowFps}
                                avgFps={metrics.fps}
                            />
                        </Grid>
                        <Grid size={6}>
                            <StatChip label='Tracks Displayed:' value={metrics.visibleTrackCount} />
                        </Grid>
                        <Grid size={6}>
                            <FrameMsStatChip
                                peakMs={metrics.peakFrameMs}
                                avgMs={metrics.frameMs}
                            />
                        </Grid>
                        <Grid size={6}>
                            <StatChip label='Tracks Total:' value={metrics.firmTrackCount} />
                        </Grid>
                        <Grid size={12}>
                            <StatChip
                                label='Throttle:'
                                value={`${Math.round((1 - metrics.loadFactor) * 100)}%`}
                                warn={metrics.loadFactor < 0.85}
                            />
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
                                Y: Max compute (ms)
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
                    <LineLegendItem
                        color={PERFORMANCE_AVERAGE_MARKER_COLORS.withinBudget}
                        label='≥60 FPS'
                    />
                    <LineLegendItem
                        color={PERFORMANCE_AVERAGE_MARKER_COLORS.warning}
                        label='<60 FPS'
                    />
                    <LineLegendItem
                        color={PERFORMANCE_AVERAGE_MARKER_COLORS.overBudget}
                        label='<50 FPS'
                    />
                    <LineLegendItem
                        color={PERFORMANCE_BUDGET_LINE_COLOR}
                        label={`${PERFORMANCE_TARGET_FRAME_MS} ms budget`}
                        dashed
                    />
                </Box>

                <Divider />

                <Typography
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.6rem',
                        lineHeight: 1.55,
                        color: 'rgba(255, 255, 255, 0.55)',
                    }}
                >
                    {`Colored bar segments show peak measured compute for each workload during each 1 s period. The horizontal line marks average compute for that period; it is colored red when above ${PERFORMANCE_50FPS_BUDGET_MS} ms, yellow when above ${PERFORMANCE_TARGET_FRAME_MS} ms, and green otherwise.`}
                </Typography>
            </Stack>
        </Card>
    )
}
