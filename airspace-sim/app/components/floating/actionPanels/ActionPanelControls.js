'use client'

import {useCallback, useMemo} from 'react'
import {
    Box,
    Button,
    FormControlLabel,
    Link,
    Switch,
    ToggleButton,
    Typography,
} from '@mui/material'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_TYPES,
    filterRenderableItemIds,
    getActionPanelItemDefinition,
} from '@/app/tools/actionPanels/actionPanelRegistry'
import {
    ACTION_PANEL_GRID_GAP_COMPACT_PX,
    ACTION_PANEL_GRID_GAP_PX,
    COMPACT_BUTTON_HORIZONTAL_INSET_PX,
    COMPACT_BUTTON_MIN_HEIGHT_PX,
    getCompactGridColumnCount,
    getLargeGridColumnCount,
} from '@/app/tools/actionPanels/actionPanelGridLayout'
import {useSensorDisplay} from '@/app/contexts/SensorDisplayContext'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'
import {MISC_SIGNAL_ID} from '@/app/simulation/signalDefinitions'
import {getDrawShapeIconComponent} from '@/app/components/floating/actionPanels/DrawShapeIcons'
import {useMapState} from '@/app/contexts/MapStateContext'

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

const LARGE_BUTTON_ACTIVE_SX = {
    ...LARGE_BUTTON_SX,
    color: '#000000',
    backgroundColor: '#FFBF00',
    borderColor: '#FFBF00',
    '&:hover': {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
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

function ActionPanelButtonLabel({definition}) {
    const IconComponent = definition.iconKey
        ? getDrawShapeIconComponent(definition.iconKey)
        : null

    if (!IconComponent) {
        return definition.label
    }

    return (
        <Box
            component='span'
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                width: '100%',
            }}
        >
            <IconComponent />
            <Box
                component='span'
                sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {definition.label}
            </Box>
        </Box>
    )
}

export function ActionPanelEmptyContent({onConfigure}) {
    return (
        <Typography
            variant='body2'
            color='text.secondary'
            sx={{fontFamily: 'monospace', lineHeight: 1.6}}
        >
            This panel is empty and needs to be configured.{' '}
            <Link
                component='button'
                type='button'
                variant='body2'
                onClick={onConfigure}
                sx={{fontFamily: 'inherit', verticalAlign: 'baseline'}}
            >
                Open Action Panel settings
            </Link>
            {' '}to add buttons and toggles.
        </Typography>
    )
}

function useActionPanelItemActions() {
    const {activeToggles, setActiveDisplayToggles, isToggleActive} = useSensorDisplay()
    const {raiseAlarmAlert, zoomIn, zoomOut} = useAlarmAlertActions()
    const {setActiveMapAction, setReinitiateTargetTrackId} = useMapState()

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
                    signalId: MISC_SIGNAL_ID,
                    message: 'HOME action is not yet implemented.',
                })
                break

            case 'INITIATE':
                setActiveMapAction((prev) => prev === 'INITIATE' ? null : 'INITIATE')
                setReinitiateTargetTrackId(null)
                break
            case 'RE_INITIATE':
                setActiveMapAction((prev) => prev === 'RE_INITIATE' ? null : 'RE_INITIATE')
                setReinitiateTargetTrackId(null)
                break
            default:
                break
        }
    }, [raiseAlarmAlert, zoomIn, zoomOut])

    return {
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

function UnifiedLargeControls({
    itemIds,
    panelWidthPx,
    isToggleActive,
    handleToggleChange,
    runButtonAction,
    activeButtonActionKey,
}) {
    const renderableItemIds = filterRenderableItemIds(itemIds)
    const columnCount = getLargeGridColumnCount(panelWidthPx, renderableItemIds.length)

    if (renderableItemIds.length === 0) {
        return null
    }

    return (
        <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_PX}>
            {renderableItemIds.map((itemId) => {
                const definition = getActionPanelItemDefinition(itemId)

                if (definition.type === ACTION_PANEL_ITEM_TYPES.TOGGLE) {
                    return (
                        <ToggleButton
                            key={`action-panel-large-toggle-${itemId}`}
                            value={definition.toggleKey}
                            selected={isToggleActive(definition.toggleKey)}
                            color='success'
                            fullWidth
                            sx={{height: LARGE_CONTROL_HEIGHT_PX}}
                            onClick={() => {
                                handleToggleChange(
                                    definition.toggleKey,
                                    !isToggleActive(definition.toggleKey),
                                )
                            }}
                        >
                            <span style={MONO_LABEL_STYLE}>{definition.label}</span>
                        </ToggleButton>
                    )
                }

                const isActiveButton = activeButtonActionKey === definition.actionKey

                return (
                    <Button
                        key={`action-panel-large-button-${itemId}`}
                        variant={isActiveButton ? 'contained' : 'outlined'}
                        color={isActiveButton ? 'primary' : 'inherit'}
                        sx={isActiveButton ? LARGE_BUTTON_ACTIVE_SX : LARGE_BUTTON_SX}
                        disabled={definition.disabled}
                        onClick={() => runButtonAction(definition.actionKey)}
                    >
                        <ActionPanelButtonLabel definition={definition} />
                    </Button>
                )
            })}
        </ResponsiveGrid>
    )
}

function UnifiedCompactControls({
    itemIds,
    panelWidthPx,
    compactColumnCount,
    isToggleActive,
    handleToggleChange,
    runButtonAction,
    activeButtonActionKey,
}) {
    const renderableItemIds = filterRenderableItemIds(itemIds)
    const columnCount = compactColumnCount
        ?? getCompactGridColumnCount(panelWidthPx, renderableItemIds.length)

    if (renderableItemIds.length === 0) {
        return null
    }

    return (
        <ResponsiveGrid columnCount={columnCount} gapPx={ACTION_PANEL_GRID_GAP_COMPACT_PX}>
            {renderableItemIds.map((itemId) => {
                const definition = getActionPanelItemDefinition(itemId)

                if (definition.type === ACTION_PANEL_ITEM_TYPES.TOGGLE) {
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
                }

                const isActiveButton = activeButtonActionKey === definition.actionKey

                return (
                    <Box
                        key={`action-panel-compact-button-${itemId}`}
                        sx={{
                            minWidth: 0,
                            px: `${COMPACT_BUTTON_HORIZONTAL_INSET_PX}px`,
                        }}
                    >
                        <Button
                            variant={isActiveButton ? 'contained' : 'outlined'}
                            color={isActiveButton ? 'primary' : 'inherit'}
                            size='small'
                            fullWidth
                            disabled={definition.disabled}
                            sx={{
                                minHeight: COMPACT_BUTTON_MIN_HEIGHT_PX,
                                px: 2,
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                justifyContent: 'flex-start',
                            }}
                            onClick={() => runButtonAction(definition.actionKey)}
                        >
                            <ActionPanelButtonLabel definition={definition} />
                        </Button>
                    </Box>
                )
            })}
        </ResponsiveGrid>
    )
}

export default function ActionPanelControls({
    itemIds,
    displayStyle,
    panelWidthPx,
    compactColumnCount,
    runButtonActionOverride,
    activeButtonActionKey,
}) {
    const {
        isToggleActive,
        handleToggleChange,
        runButtonAction: defaultRunButtonAction,
    } = useActionPanelItemActions()

    const {activeMapAction} = useMapState()
    const currentActiveButtonActionKey = activeButtonActionKey ?? activeMapAction

    const runButtonAction = runButtonActionOverride ?? defaultRunButtonAction

    const controlsProps = useMemo(() => ({
        itemIds,
        panelWidthPx,
        compactColumnCount,
        isToggleActive,
        handleToggleChange,
        runButtonAction,
        activeButtonActionKey: currentActiveButtonActionKey,
    }), [
        currentActiveButtonActionKey,
        compactColumnCount,
        handleToggleChange,
        isToggleActive,
        itemIds,
        panelWidthPx,
        runButtonAction,
    ])

    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        return <UnifiedCompactControls {...controlsProps} />
    }

    return <UnifiedLargeControls {...controlsProps} />
}
