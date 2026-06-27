'use client'

import {useCallback, useRef} from 'react'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {Box, Divider, IconButton, Typography} from '@mui/material'
import BasicGlassPanel from './BasicGlassPanel'
import ActionPanelControls from './ActionPanelControls'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'
import {useFloatingActionPanelLayout} from '@/app/hooks/map/useFloatingActionPanelLayout'

export default function ActionPanel({
    panel,
    layout,
    mapContainerRef,
    enabled,
}) {
    const panelRef = useRef(null)
    const {updateActionPanelLayout} = useActionPanels()

    const handleLayoutCommit = useCallback((nextLayout) => {
        updateActionPanelLayout(panel.id, nextLayout)
    }, [panel.id, updateActionPanelLayout])

    const {
        position,
        width,
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
        enabled,
        storedAnchor: layout.anchor,
        storedWidth: layout.width,
        onLayoutCommit: handleLayoutCommit,
    })

    return (
        <Box
            ref={panelRef}
            data-action-panel={panel.id}
            onPointerDown={handlePanelPointerDown}
            sx={{
                position: 'absolute',
                left: position?.left ?? -10000,
                top: position?.top ?? -10000,
                width,
                visibility: position ? 'visible' : 'hidden',
            }}
        >
            <BasicGlassPanel
                width={width}
                hideTitle
            >
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 0.5,
                    }}
                >
                    <IconButton
                        size='small'
                        aria-label={`Drag ${panel.title}`}
                        sx={{
                            cursor: enabled ? 'grab' : 'default',
                            touchAction: 'none',
                            flexGrow: 1,
                            minWidth: 0,
                            justifyContent: 'flex-start',
                            borderRadius: 1,
                            px: 0.5,
                            mx: -0.5,
                        }}
                        onPointerDown={handleDragHandlePointerDown}
                        onPointerMove={handleDragHandlePointerMove}
                        onPointerUp={handleDragHandlePointerUp}
                        onPointerCancel={handleDragHandlePointerUp}
                    >
                        <DragIndicatorIcon fontSize='small' sx={{mr: 0.5}}/>
                        <Typography
                            variant='h6'
                            component='span'
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {panel.title}
                        </Typography>
                    </IconButton>
                </Box>
                <Divider orientation='horizontal' flexItem sx={{width: '100%', mb: 1.5}}/>

                <ActionPanelControls
                    itemIds={panel.itemIds}
                    displayStyle={panel.displayStyle}
                />
            </BasicGlassPanel>

            <Box
                aria-hidden
                onPointerDown={handleResizeHandlePointerDown}
                onPointerMove={handleResizeHandlePointerMove}
                onPointerUp={handleResizeHandlePointerUp}
                onPointerCancel={handleResizeHandlePointerUp}
                sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 16,
                    height: 16,
                    cursor: enabled ? 'nwse-resize' : 'default',
                    touchAction: 'none',
                }}
            />
        </Box>
    )
}
