'use client'

import {useCallback, useRef} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {Box, Divider, IconButton, Typography} from '@mui/material'
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
import {useFloatingActionPanelLayout} from '@/app/hooks/map/useFloatingActionPanelLayout'
import {useFloatingDraggableRegistration} from '@/app/hooks/ui/useFloatingDraggableRegistration'

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
    const {activeDrawToolItemId, startDrawTool} = useDrawGeometry()
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
                    activeButtonActionKey={activeDrawToolItemId}
                />
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
