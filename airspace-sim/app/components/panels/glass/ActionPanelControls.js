'use client'

import {useCallback} from 'react'
import {
    Button,
    FormControlLabel,
    Grid,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_TYPES,
    getActionPanelItemDefinition,
} from '@/app/actionPanels/actionPanelRegistry'
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

function LargeToggleControls({itemIds, activeToggles, setActiveDisplayToggles}) {
    const handleToggles = (event, newToggles) => {
        setActiveDisplayToggles(newToggles.filter((toggle) => !String(toggle).startsWith('SPACER')))
    }

    return (
        <ToggleButtonGroup
            value={activeToggles}
            onChange={handleToggles}
        >
            <Grid
                container
                spacing={2}
                style={{width: '100%'}}
            >
                {itemIds.map((itemId, index) => {
                    const definition = getActionPanelItemDefinition(itemId)

                    if (!definition) {
                        return null
                    }

                    if (definition.type === ACTION_PANEL_ITEM_TYPES.SPACER) {
                        return (
                            <Grid
                                size={4}
                                key={`action-panel-spacer-${index}`}
                            >
                                <ToggleButton
                                    value={`SPACER_${index}`}
                                    disabled
                                    color='success'
                                    fullWidth
                                    sx={{height: LARGE_CONTROL_HEIGHT_PX}}
                                >
                                    <span style={MONO_LABEL_STYLE}>-</span>
                                </ToggleButton>
                            </Grid>
                        )
                    }

                    return (
                        <Grid
                            size={4}
                            key={`action-panel-toggle-${itemId}-${index}`}
                        >
                            <ToggleButton
                                value={definition.toggleKey}
                                color='success'
                                fullWidth
                                sx={{height: LARGE_CONTROL_HEIGHT_PX}}
                            >
                                <span style={MONO_LABEL_STYLE}>{definition.label}</span>
                            </ToggleButton>
                        </Grid>
                    )
                })}
            </Grid>
        </ToggleButtonGroup>
    )
}

function CompactToggleControls({itemIds, isToggleActive, handleToggleChange}) {
    return (
        <Grid
            container
            spacing={1}
            style={{width: '100%'}}
        >
            {itemIds.map((itemId, index) => {
                const definition = getActionPanelItemDefinition(itemId)

                if (!definition || definition.type === ACTION_PANEL_ITEM_TYPES.SPACER) {
                    return null
                }

                if (definition.type !== ACTION_PANEL_ITEM_TYPES.TOGGLE) {
                    return null
                }

                return (
                    <Grid
                        size={12}
                        key={`action-panel-compact-toggle-${itemId}-${index}`}
                    >
                        <FormControlLabel
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
                                '& .MuiFormControlLabel-label': {
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                    </Grid>
                )
            })}
        </Grid>
    )
}

function LargeButtonControls({itemIds, runButtonAction}) {
    return (
        <Grid
            container
            spacing={2}
            style={{width: '100%'}}
        >
            {itemIds.map((itemId, index) => {
                const definition = getActionPanelItemDefinition(itemId)

                if (!definition) {
                    return null
                }

                const isSpacer = definition.type === ACTION_PANEL_ITEM_TYPES.SPACER

                return (
                    <Grid
                        size={4}
                        key={`action-panel-button-${itemId}-${index}`}
                    >
                        <Button
                            variant='outlined'
                            color='inherit'
                            sx={LARGE_BUTTON_SX}
                            disabled={isSpacer}
                            onClick={() => {
                                if (!isSpacer) {
                                    runButtonAction(definition.actionKey)
                                }
                            }}
                        >
                            {isSpacer ? '-' : definition.label}
                        </Button>
                    </Grid>
                )
            })}
        </Grid>
    )
}

function CompactButtonControls({itemIds, runButtonAction}) {
    return (
        <Grid
            container
            spacing={1}
            style={{width: '100%'}}
        >
            {itemIds.map((itemId, index) => {
                const definition = getActionPanelItemDefinition(itemId)

                if (!definition || definition.type === ACTION_PANEL_ITEM_TYPES.SPACER) {
                    return null
                }

                if (definition.type !== ACTION_PANEL_ITEM_TYPES.BUTTON) {
                    return null
                }

                return (
                    <Grid
                        size={12}
                        key={`action-panel-compact-button-${itemId}-${index}`}
                    >
                        <Button
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
                    </Grid>
                )
            })}
        </Grid>
    )
}

function panelHasToggleItems(itemIds) {
    return itemIds.some((itemId) => {
        const definition = getActionPanelItemDefinition(itemId)
        return definition?.type === ACTION_PANEL_ITEM_TYPES.TOGGLE
    })
}

function panelHasButtonItems(itemIds) {
    return itemIds.some((itemId) => {
        const definition = getActionPanelItemDefinition(itemId)
        return definition?.type === ACTION_PANEL_ITEM_TYPES.BUTTON
    })
}

export default function ActionPanelControls({itemIds, displayStyle}) {
    const {
        activeToggles,
        setActiveDisplayToggles,
        isToggleActive,
        handleToggleChange,
        runButtonAction,
    } = useActionPanelItemActions()

    const hasToggles = panelHasToggleItems(itemIds)
    const hasButtons = panelHasButtonItems(itemIds)

    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        return (
            <>
                {hasToggles ? (
                    <CompactToggleControls
                        itemIds={itemIds}
                        isToggleActive={isToggleActive}
                        handleToggleChange={handleToggleChange}
                    />
                ) : null}
                {hasButtons ? (
                    <CompactButtonControls
                        itemIds={itemIds}
                        runButtonAction={runButtonAction}
                    />
                ) : null}
            </>
        )
    }

    return (
        <>
            {hasToggles ? (
                <LargeToggleControls
                    itemIds={itemIds}
                    activeToggles={activeToggles}
                    setActiveDisplayToggles={setActiveDisplayToggles}
                />
            ) : null}
            {hasButtons ? (
                <LargeButtonControls
                    itemIds={itemIds}
                    runButtonAction={runButtonAction}
                />
            ) : null}
        </>
    )
}
