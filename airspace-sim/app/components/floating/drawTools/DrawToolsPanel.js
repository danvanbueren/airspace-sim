'use client'

import {useCallback, useMemo, useRef} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {Box, Divider, IconButton, Typography, Slider} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import {
    setStrokeColorForMode,
    setFillColorForMode,
} from '@/app/tools/map/drawGeometry/drawGeometryColor'
import FloatingPanel from '../shared/FloatingPanel'
import ActionPanelControls from '../actionPanels/ActionPanelControls'
import {
    ACTION_PANEL_DISPLAY_STYLES,
} from '@/app/tools/actionPanels/actionPanelRegistry'
import {
    DRAW_TOOLS_COMPACT_COLUMN_COUNT,
    DRAW_TOOLS_DEFAULT_ITEM_IDS,
    DRAW_TOOLS_PANEL_TITLE,
} from '@/app/tools/actionPanels/drawToolsActionPanel'
import {MAP_FLOATING_INSET_PX} from '@/app/constants/mapUiLayout'
import {FLOATING_DRAGGABLE_IDS} from '@/app/constants/floatingDraggableIds'
import {useDrawTools} from '@/app/contexts/DrawToolsContext'
import {useDrawGeometry} from '@/app/contexts/DrawGeometryContext'
import {DRAW_TOOL_ITEM_ID_SET} from '@/app/tools/actionPanels/drawToolsActionPanel'
import {GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM} from '@/app/tools/map/drawGeometry/drawGeometryTypes'
import {isGeometryShapeInPendingDrawStatus} from '@/app/tools/map/drawGeometry/drawGeometryModels'
import {useFloatingActionPanelLayout} from '@/app/hooks/map/useFloatingActionPanelLayout'
import {useFloatingDraggableRegistration} from '@/app/hooks/ui/useFloatingDraggableRegistration'

function ColorPickerSection({
    label,
    currentColor,
    onChangeColor,
    themeMode,
}) {
    const defaultColor = themeMode === 'dark' ? '#ffffff' : '#111111'
    const swatches = [
        defaultColor,
        '#ffc107', // Amber
        '#10b981', // Emerald
        '#2196f3', // Azure
        '#f44336', // Rose
        '#9c27b0', // Purple
    ]

    const isCustomActive = !swatches.some(s => s.toLowerCase() === currentColor?.toLowerCase())

    return (
        <Box>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {swatches.map((color) => {
                    const isActive = currentColor?.toLowerCase() === color.toLowerCase()
                    return (
                        <Box
                            key={color}
                            onClick={() => onChangeColor(color)}
                            sx={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                bgcolor: color,
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: isActive ? 'primary.main' : 'transparent',
                                boxShadow: isActive ? '0 0 0 1px rgba(0,0,0,0.2)' : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                transition: 'transform 0.15s ease, border-color 0.15s ease',
                                '&:hover': {
                                    transform: 'scale(1.15)',
                                },
                            }}
                            title={color === defaultColor ? 'Theme Default' : color}
                        />
                    )
                })}
                {/* Custom Color Selector */}
                <Box
                    sx={{
                        position: 'relative',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: isCustomActive 
                            ? currentColor 
                            : 'linear-gradient(45deg, #f44336, #ffeb3b, #4caf50, #2196f3, #9c27b0)',
                        border: '2px solid',
                        borderColor: isCustomActive ? 'primary.main' : 'transparent',
                        boxShadow: isCustomActive ? '0 0 0 1px rgba(0,0,0,0.2)' : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        '&:hover': {
                            transform: 'scale(1.15)',
                        },
                    }}
                    title={isCustomActive ? `Custom: ${currentColor}` : 'Custom Color'}
                >
                    <Box
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isCustomActive ? 'primary.contrastText' : 'transparent',
                        }}
                    />
                    <input
                        type='color'
                        value={currentColor || defaultColor}
                        onChange={(e) => onChangeColor(e.target.value)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            padding: 0,
                            border: 'none',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

function ResizeIndicator() {
    return (
        <Box
            aria-hidden
            sx={{
                width: 10,
                height: 10,
                opacity: 0.7,
                backgroundImage: [
                    'linear-gradient(135deg, transparent 0 40%, rgba(158,158,158,0.95) 40% 45%, transparent 45% 55%, rgba(158,158,158,0.95) 55% 60%, transparent 60%)',
                    'linear-gradient(135deg, transparent 0 55%, rgba(158,158,158,0.95) 55% 60%, transparent 60%)',
                ].join(', '),
            }}
        />
    )
}

export default function DrawToolsPanel({interactionsEnabled = true}) {
    const panelRef = useRef(null)
    const {drawToolsState, closeDrawTools, updateDrawToolsLayout} = useDrawTools()
    const {
        shapes,
        activeShapeId,
        startDrawTool,
        strokeColorsByMode,
        fillColorsByMode,
        defaultFillOpacity,
        setStrokeColorsByMode,
        setFillColorsByMode,
        setDefaultFillOpacity,
    } = useDrawGeometry()

    const theme = useTheme()
    const strokeColor = strokeColorsByMode[theme.palette.mode]
    const fillColor = fillColorsByMode[theme.palette.mode]

    const handleStrokeColorChange = useCallback((newColor) => {
        setStrokeColorsByMode(setStrokeColorForMode(strokeColorsByMode, theme.palette.mode, newColor))
    }, [strokeColorsByMode, setStrokeColorsByMode, theme.palette.mode])

    const handleFillColorChange = useCallback((newColor) => {
        setFillColorsByMode(setFillColorForMode(fillColorsByMode, theme.palette.mode, newColor))
    }, [fillColorsByMode, setFillColorsByMode, theme.palette.mode])

    const handleFillOpacityChange = useCallback((event, newValue) => {
        setDefaultFillOpacity(newValue / 100)
    }, [setDefaultFillOpacity])

    const highlightedDrawToolItemId = useMemo(() => {
        if (!activeShapeId) {
            return null
        }

        const activeShape = shapes.find((shape) => shape.id === activeShapeId)

        if (!isGeometryShapeInPendingDrawStatus(activeShape)) {
            return null
        }

        return GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM[activeShape.type] ?? null
    }, [activeShapeId, shapes])
    const draggableId = FLOATING_DRAGGABLE_IDS.drawTools
    const {zIndex, bringToFront} = useFloatingDraggableRegistration(
        drawToolsState.isOpen ? draggableId : null,
    )

    const handleLayoutCommit = useCallback((nextLayout) => {
        updateDrawToolsLayout(nextLayout)
    }, [updateDrawToolsLayout])

    const {
        position,
        width,
        height,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    } = useFloatingActionPanelLayout({
        panelRef,
        interactionsEnabled,
        displayStyle: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
        itemIds: DRAW_TOOLS_DEFAULT_ITEM_IDS,
        storedAnchor: drawToolsState.layout?.anchor ?? null,
        storedWidth: drawToolsState.layout?.width ?? null,
        storedHeight: drawToolsState.layout?.height ?? null,
        onLayoutCommit: handleLayoutCommit,
    })

    const handlePanelActivate = useCallback((event) => {
        bringToFront()
        handlePanelPointerDown(event)
    }, [bringToFront, handlePanelPointerDown])

    const handleDragHandleActivate = useCallback((event) => {
        bringToFront()
        handleDragHandlePointerDown(event)
    }, [bringToFront, handleDragHandlePointerDown])

    const handleResizeHandleActivate = useCallback((event) => {
        bringToFront()
        handleResizeHandlePointerDown(event)
    }, [bringToFront, handleResizeHandlePointerDown])

    const handleClose = useCallback((event) => {
        event.stopPropagation()
        closeDrawTools()
    }, [closeDrawTools])

    const handleDrawToolSelect = useCallback((actionKey) => {
        if (!DRAW_TOOL_ITEM_ID_SET.has(actionKey)) {
            return
        }

        startDrawTool(actionKey)
    }, [startDrawTool])

    if (!drawToolsState.isOpen || !drawToolsState.layout) {
        return null
    }

    const hasExplicitHeight = typeof height === 'number'

    return (
        <Box
            ref={panelRef}
            data-draw-tools-panel
            data-floating-draggable={draggableId}
            onPointerDown={handlePanelActivate}
            suppressHydrationWarning
            sx={{
                position: 'absolute',
                left: position?.left ?? MAP_FLOATING_INSET_PX,
                top: position?.top ?? MAP_FLOATING_INSET_PX,
                width,
                height: hasExplicitHeight ? height : 'auto',
                zIndex,
            }}
        >
            <FloatingPanel
                width={width}
                height={hasExplicitHeight ? height : null}
                scrollableBody={hasExplicitHeight}
                header={(
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'center',
                                gap: 0.5,
                                flexShrink: 0,
                                minWidth: 0,
                            }}
                        >
                            <Box
                                aria-label={`Drag ${DRAW_TOOLS_PANEL_TITLE}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    flex: 1,
                                    minWidth: 0,
                                    cursor: interactionsEnabled ? 'grab' : 'default',
                                    touchAction: 'none',
                                }}
                                onPointerDown={handleDragHandleActivate}
                                onPointerMove={handleDragHandlePointerMove}
                                onPointerUp={handleDragHandlePointerUp}
                                onPointerCancel={handleDragHandlePointerUp}
                            >
                                <DragIndicatorIcon
                                    fontSize='small'
                                    sx={{flexShrink: 0, opacity: 0.85}}
                                />
                                <Typography
                                    variant='h6'
                                    component='span'
                                    title={DRAW_TOOLS_PANEL_TITLE}
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 'bold',
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {DRAW_TOOLS_PANEL_TITLE}
                                </Typography>
                            </Box>
                            <IconButton
                                size='small'
                                aria-label={`Close ${DRAW_TOOLS_PANEL_TITLE}`}
                                sx={{flexShrink: 0}}
                                onPointerDown={(event) => {
                                    event.stopPropagation()
                                }}
                                onClick={handleClose}
                            >
                                <CloseIcon fontSize='small'/>
                            </IconButton>
                        </Box>
                        <Divider orientation='horizontal' flexItem sx={{width: '100%', mb: 0.5, flexShrink: 0}}/>
                    </>
                )}
            >
                <ActionPanelControls
                    itemIds={DRAW_TOOLS_DEFAULT_ITEM_IDS}
                    displayStyle={ACTION_PANEL_DISPLAY_STYLES.COMPACT}
                    panelWidthPx={width}
                    compactColumnCount={DRAW_TOOLS_COMPACT_COLUMN_COUNT}
                    runButtonActionOverride={handleDrawToolSelect}
                    activeButtonActionKey={highlightedDrawToolItemId}
                />

                <Divider sx={{ my: 1 }} />
                <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography
                        variant='caption'
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'text.secondary',
                        }}
                    >
                        Default Style
                    </Typography>
                    <ColorPickerSection
                        label="Stroke Color"
                        currentColor={strokeColor}
                        onChangeColor={handleStrokeColorChange}
                        themeMode={theme.palette.mode}
                    />
                    <ColorPickerSection
                        label="Fill Color"
                        currentColor={fillColor}
                        onChangeColor={handleFillColorChange}
                        themeMode={theme.palette.mode}
                    />
                    <Box>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                            Fill Opacity ({Math.round(defaultFillOpacity * 100)}%)
                        </Typography>
                        <Slider
                            value={Math.round(defaultFillOpacity * 100)}
                            onChange={handleFillOpacityChange}
                            min={0}
                            max={100}
                            size='small'
                            valueLabelDisplay='auto'
                            sx={{ mt: 0.5 }}
                        />
                    </Box>
                </Box>
            </FloatingPanel>

            <Box
                aria-label='Resize panel'
                onPointerDown={handleResizeHandleActivate}
                onPointerMove={handleResizeHandlePointerMove}
                onPointerUp={handleResizeHandlePointerUp}
                onPointerCancel={handleResizeHandlePointerUp}
                sx={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    width: 20,
                    height: 20,
                    cursor: interactionsEnabled ? 'nwse-resize' : 'default',
                    touchAction: 'none',
                }}
            >
                <ResizeIndicator/>
            </Box>
        </Box>
    )
}
