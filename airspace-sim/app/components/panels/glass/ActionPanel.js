'use client'

import {useCallback, useRef} from 'react'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import {Box, Divider, IconButton, Typography} from '@mui/material'
import BasicGlassPanel from './BasicGlassPanel'
import ActionPanelControls, {ActionPanelEmptyContent} from './ActionPanelControls'
import {filterRenderableItemIds} from '@/app/actionPanels/actionPanelRegistry'
import {MAP_GLASS_INSET_PX} from '@/app/constants/mapUiLayout'
import {FLOATING_DRAGGABLE_IDS} from '@/app/constants/floatingDraggableIds'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'
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

export default function ActionPanel({
    panel,
    layout,
    mapContainerRef,
    interactionsEnabled,
    onEditPanelSettings,
}) {
    const panelRef = useRef(null)
    const {updateActionPanelLayout} = useActionPanels()
    const draggableId = FLOATING_DRAGGABLE_IDS.actionPanel(panel.id)
    const {zIndex, bringToFront} = useFloatingDraggableRegistration(draggableId)

    const handleLayoutCommit = useCallback((nextLayout) => {
        updateActionPanelLayout(panel.id, nextLayout)
    }, [panel.id, updateActionPanelLayout])

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
        mapContainerRef,
        panelRef,
        interactionsEnabled,
        displayStyle: panel.displayStyle,
        itemIds: panel.itemIds,
        storedAnchor: layout.anchor,
        storedWidth: layout.width,
        storedHeight: layout.height,
        onLayoutCommit: handleLayoutCommit,
    })

    const hasExplicitHeight = typeof height === 'number'
    const hasPanelItems = filterRenderableItemIds(panel.itemIds).length > 0

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

    const handleEditSettings = useCallback(() => {
        onEditPanelSettings?.(panel.id)
    }, [onEditPanelSettings, panel.id])

    return (
        <Box
            ref={panelRef}
            data-action-panel={panel.id}
            data-floating-draggable={draggableId}
            onPointerDown={handlePanelActivate}
            suppressHydrationWarning
            sx={{
                position: 'absolute',
                left: position?.left ?? MAP_GLASS_INSET_PX,
                top: position?.top ?? MAP_GLASS_INSET_PX,
                width,
                height: hasExplicitHeight ? height : 'auto',
                zIndex,
            }}
        >
            <BasicGlassPanel
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
                            <IconButton
                                size='small'
                                aria-label={`Drag ${panel.title}`}
                                sx={{
                                    cursor: interactionsEnabled ? 'grab' : 'default',
                                    touchAction: 'none',
                                    flexShrink: 0,
                                }}
                                onPointerDown={handleDragHandleActivate}
                                onPointerMove={handleDragHandlePointerMove}
                                onPointerUp={handleDragHandlePointerUp}
                                onPointerCancel={handleDragHandlePointerUp}
                            >
                                <DragIndicatorIcon fontSize='small'/>
                            </IconButton>
                            <Typography
                                variant='h6'
                                component='span'
                                title={panel.title}
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
                                {panel.title}
                            </Typography>
                            <IconButton
                                size='small'
                                aria-label={`Edit ${panel.title} settings`}
                                sx={{flexShrink: 0}}
                                onClick={handleEditSettings}
                            >
                                <EditIcon fontSize='small'/>
                            </IconButton>
                        </Box>
                        <Divider orientation='horizontal' flexItem sx={{width: '100%', mb: 0.5, flexShrink: 0}}/>
                    </>
                )}
            >
                {hasPanelItems ? (
                    <ActionPanelControls
                        itemIds={panel.itemIds}
                        displayStyle={panel.displayStyle}
                        panelWidthPx={width}
                    />
                ) : (
                    <ActionPanelEmptyContent onConfigure={handleEditSettings}/>
                )}
            </BasicGlassPanel>

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
