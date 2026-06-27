'use client'

import {useCallback, useMemo} from 'react'
import {
    Box,
    Button,
    FormControlLabel,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_TYPES,
    filterRenderableItemIds,
    getActionPanelItemDefinition,
} from '@/app/actionPanels/actionPanelRegistry'
import {
    ACTION_PANEL_GRID_GAP_COMPACT_PX,
    ACTION_PANEL_GRID_GAP_PX,
    getCompactButtonColumnCount,
    getCompactToggleColumnCount,
    getLargeGridColumnCount,
} from '@/app/actionPanels/actionPanelGridLayout'
import {useSensorDisplay} from '@/app/contexts/SensorDisplayContext'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'

const LARGE_CONTROL_HEIGHT_PX = 80

const LARGE_BUTTON_SX = {
    height: LARGE_CONTROL_HEIGHT_PX,
    display: 'block',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    borderColor: 'grey.800',
    '&:hover': {
        borderColor: 'grey.400',
    },
}

const MONO_LABEL_STYLE = {
    display: 'block',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'monospace',
    fontWeight: 'bold',
}

function useActionPanelItemActions() {
    const {activeToggles, setActiveDisplayToggles, isToggleActive} = useSensorDisplay()
    const {raiseAlarmAlert, zoomIn, zoomOut} = useAlarmAlertActions()

    const handleToggleChange = useCallback((toggleKey, isActive) => {
        setActiveDisplayToggles(
            isActive
                ? [...activeToggles.filter((toggle) => toggle !== toggleKey), toggleKey]
                : activeToggles.filter((toggle) => toggle !== toggleKey),
        )
    }, [activeToggles, setActiveDisplayToggles])

    const runButtonAction = useCallback((actionKey) => {
        switch (actionKey) {
            case 'ZOOM_IN':
                zoomIn()
                break
            case 'ZOOM_OUT':
                zoomOut()
                break
            case 'HOME':
                raiseAlarmAlert({
                    signalId: 'UI_HOME',
                    message: 'HOME action is not yet implemented.',
                })
                break
            case 'CENTER_E3':
                raiseAlarmAlert({
                    signalId: 'UI_CENTER_E3',
                    message: 'CENTER ON E-3 action is not yet implemented.',
                })
                break
            case 'INITIATE':
                raiseAlarmAlert({
                    signalId: 'UI_INITIATE',
                    message: 'INITIATE action is coming soon.',
                })
                break
            case 'RE_INITIATE':
                raiseAlarmAlert({
                    signalId: 'UI_RE_INITIATE',
                    message: 'RE-INITIATE action is coming soon.',
                })
                break
            default:
                break
        }
    }, [raiseAlarmAlert, zoomIn, zoomOut])

    return {
        activeToggles,
        setActiveDisplayToggles,
        isToggleActive,
        handleToggleChange,
        runButtonAction,
    }
}

function ResponsiveGrid({columnCount, gapPx, children}) {
    return (
        <Box
            sx={{
                display: 'grid',
                width: '100%',
                gap: `${gapPx}px`,
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                alignItems: 'stretch',
            }}
        >
            {children}
        </Box>
    )
}

function getRenderableItemsByType(itemIds, type) {
    return filterRenderableItemIds(itemIds).filter((itemId) => (
        getActionPanelItemDefinition(itemId)?.type === type
    ))
}

function LargeToggleControls({itemIds, panelWidthPx, activeToggles, setActiveDisplayToggles}) {
    const toggleItemIds = getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.TOGGLE)
    const columnCount = getLargeGridColumnCount(panelWidthPx, toggleItemIds.length)

    const handleToggles = (event, newToggles) => {
        setActiveDisplayToggles(newToggles)
    }

    if (toggleItemIds.length === 0) {
        return null
    }

    return (
        <ToggleButtonGroup
            value={activeToggles}
            onChange={handleToggles}
            sx={{width: '100%'}}
        >
            <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_PX}>
                {toggleItemIds.map((itemId) => {
                    const definition = getActionPanelItemDefinition(itemId)

                    return (
                        <ToggleButton
                            key={`action-panel-toggle-${itemId}`}
                            value={definition.toggleKey}
                            color='success'
                            fullWidth
                            sx={{height: LARGE_CONTROL_HEIGHT_PX}}
                        >
                            <span style={MONO_LABEL_STYLE}>{definition.label}</span>
                        </ToggleButton>
                    )
                })}
            </ResponsiveGrid>
        </ToggleButtonGroup>
    )
}

function CompactToggleControls({itemIds, panelWidthPx, isToggleActive, handleToggleChange}) {
    const toggleItemIds = getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.TOGGLE)
    const columnCount = getCompactToggleColumnCount(panelWidthPx, toggleItemIds.length)

    if (toggleItemIds.length === 0) {
        return null
    }

    return (
        <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_COMPACT_PX}>
            {toggleItemIds.map((itemId) => {
                const definition = getActionPanelItemDefinition(itemId)

                return (
                    <FormControlLabel
                        key={`action-panel-compact-toggle-${itemId}`}
                        control={(
                            <Switch
                                color='success'
                                checked={isToggleActive(definition.toggleKey)}
                                onChange={(event) => {
                                    handleToggleChange(definition.toggleKey, event.target.checked)
                                }}
                            />
                        )}
                        label={definition.label}
                        sx={{
                            width: '100%',
                            mx: 0,
                            minWidth: 0,
                            '& .MuiFormControlLabel-label': {
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                            },
                        }}
                    />
                )
            })}
        </ResponsiveGrid>
    )
}

function LargeButtonControls({itemIds, panelWidthPx, runButtonAction}) {
    const buttonItemIds = getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.BUTTON)
    const columnCount = getLargeGridColumnCount(panelWidthPx, buttonItemIds.length)

    if (buttonItemIds.length === 0) {
        return null
    }

    return (
        <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_PX}>
            {buttonItemIds.map((itemId) => {
                const definition = getActionPanelItemDefinition(itemId)

                return (
                    <Button
                        key={`action-panel-button-${itemId}`}
                        variant='outlined'
                        color='inherit'
                        sx={LARGE_BUTTON_SX}
                        onClick={() => runButtonAction(definition.actionKey)}
                    >
                        {definition.label}
                    </Button>
                )
            })}
        </ResponsiveGrid>
    )
}

function CompactButtonControls({itemIds, panelWidthPx, runButtonAction}) {
    const buttonItemIds = getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.BUTTON)
    const columnCount = getCompactButtonColumnCount(panelWidthPx, buttonItemIds.length)

    if (buttonItemIds.length === 0) {
        return null
    }

    return (
        <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_COMPACT_PX}>
            {buttonItemIds.map((itemId) => {
                const definition = getActionPanelItemDefinition(itemId)

                return (
                    <Button
                        key={`action-panel-compact-button-${itemId}`}
                        variant='outlined'
                        color='inherit'
                        size='small'
                        fullWidth
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            justifyContent: 'flex-start',
                        }}
                        onClick={() => runButtonAction(definition.actionKey)}
                    >
                        {definition.label}
                    </Button>
                )
            })}
        </ResponsiveGrid>
    )
}

function panelHasToggleItems(itemIds) {
    return getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.TOGGLE).length > 0
}

function panelHasButtonItems(itemIds) {
    return getRenderableItemsByType(itemIds, ACTION_PANEL_ITEM_TYPES.BUTTON).length > 0
}

export default function ActionPanelControls({itemIds, displayStyle, panelWidthPx}) {
    const {
        activeToggles,
        setActiveDisplayToggles,
        isToggleActive,
        handleToggleChange,
        runButtonAction,
    } = useActionPanelItemActions()

    const hasToggles = useMemo(() => panelHasToggleItems(itemIds), [itemIds])
    const hasButtons = useMemo(() => panelHasButtonItems(itemIds), [itemIds])

    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        return (
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, width: '100%'}}>
                {hasToggles ? (
                    <CompactToggleControls
                        itemIds={itemIds}
                        panelWidthPx={panelWidthPx}
                        isToggleActive={isToggleActive}
                        handleToggleChange={handleToggleChange}
                    />
                ) : null}
                {hasButtons ? (
                    <CompactButtonControls
                        itemIds={itemIds}
                        panelWidthPx={panelWidthPx}
                        runButtonAction={runButtonAction}
                    />
                ) : null}
            </Box>
        )
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            {hasToggles ? (
                <LargeToggleControls
                    itemIds={itemIds}
                    panelWidthPx={panelWidthPx}
                    activeToggles={activeToggles}
                    setActiveDisplayToggles={setActiveDisplayToggles}
                />
            ) : null}
            {hasButtons ? (
                <LargeButtonControls
                    itemIds={itemIds}
                    panelWidthPx={panelWidthPx}
                    runButtonAction={runButtonAction}
                />
            ) : null}
        </Box>
    )
}
