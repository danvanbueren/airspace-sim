'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    parseCookieJsonValue,
    readCookieValue,
    writeCookieJsonValue,
} from '@/app/tools/browser/CookieStorage'
import {DEFAULT_ACTION_PANELS_STATE} from '@/app/actionPanels/actionPanelDefaults'
import {
    createEmptyActionPanel,
    normalizeActionPanelsState,
} from '@/app/actionPanels/normalizeActionPanels'
import {cloneActionPanelTemplateState} from '@/app/actionPanels/actionPanelTemplates'

export const ACTION_PANELS_COOKIE_NAME = 'actionPanels'

const ActionPanelsContext = createContext(null)

function parseInitialActionPanels(initialActionPanels) {
    return normalizeActionPanelsState(parseCookieJsonValue(
        initialActionPanels,
        DEFAULT_ACTION_PANELS_STATE,
    ))
}

function readBrowserActionPanels() {
    return normalizeActionPanelsState(parseCookieJsonValue(
        readCookieValue(ACTION_PANELS_COOKIE_NAME),
        DEFAULT_ACTION_PANELS_STATE,
    ))
}

function writeActionPanelsCookie(actionPanelsState) {
    writeCookieJsonValue(ACTION_PANELS_COOKIE_NAME, actionPanelsState)
}

export function ActionPanelsProvider({children, initialActionPanels}) {
    const [actionPanelsState, setActionPanelsState] = useState(
        () => parseInitialActionPanels(initialActionPanels),
    )

    useEffect(() => {
        const browserState = readBrowserActionPanels()

        setActionPanelsState((currentState) => {
            const currentJson = JSON.stringify(currentState)
            const browserJson = JSON.stringify(browserState)

            return currentJson === browserJson ? currentState : browserState
        })
    }, [])

    const updateActionPanelsState = useCallback((updater) => {
        setActionPanelsState((currentState) => {
            const nextState = typeof updater === 'function' ? updater(currentState) : updater
            const normalizedState = normalizeActionPanelsState(nextState)

            writeActionPanelsCookie(normalizedState)

            return normalizedState
        })
    }, [])

    const resetActionPanelsState = useCallback(() => {
        writeActionPanelsCookie(DEFAULT_ACTION_PANELS_STATE)
        setActionPanelsState(DEFAULT_ACTION_PANELS_STATE)
    }, [])

    const addActionPanel = useCallback(({title} = {}) => {
        const {panel, layout} = createEmptyActionPanel({title})

        updateActionPanelsState((currentState) => ({
            panels: [...currentState.panels, panel],
            layouts: {
                ...currentState.layouts,
                [panel.id]: layout,
            },
        }))

        return panel.id
    }, [updateActionPanelsState])

    const removeActionPanel = useCallback((panelId) => {
        updateActionPanelsState((currentState) => {
            const nextPanels = currentState.panels.filter((panel) => panel.id !== panelId)

            if (nextPanels.length === currentState.panels.length) {
                return currentState
            }

            const nextLayouts = {...currentState.layouts}
            delete nextLayouts[panelId]

            return {
                panels: nextPanels,
                layouts: nextLayouts,
            }
        })
    }, [updateActionPanelsState])

    const renameActionPanel = useCallback((panelId, title) => {
        updateActionPanelsState((currentState) => ({
            ...currentState,
            panels: currentState.panels.map((panel) => (
                panel.id === panelId
                    ? {...panel, title}
                    : panel
            )),
        }))
    }, [updateActionPanelsState])

    const setActionPanelDisplayStyle = useCallback((panelId, displayStyle) => {
        updateActionPanelsState((currentState) => ({
            ...currentState,
            panels: currentState.panels.map((panel) => (
                panel.id === panelId
                    ? {...panel, displayStyle}
                    : panel
            )),
        }))
    }, [updateActionPanelsState])

    const setActionPanelItemIds = useCallback((panelId, itemIds) => {
        updateActionPanelsState((currentState) => ({
            ...currentState,
            panels: currentState.panels.map((panel) => (
                panel.id === panelId
                    ? {...panel, itemIds}
                    : panel
            )),
        }))
    }, [updateActionPanelsState])

    const updateActionPanelLayout = useCallback((panelId, layoutUpdates) => {
        updateActionPanelsState((currentState) => {
            const currentLayout = currentState.layouts[panelId]

            if (!currentLayout) {
                return currentState
            }

            return {
                ...currentState,
                layouts: {
                    ...currentState.layouts,
                    [panelId]: {
                        ...currentLayout,
                        ...layoutUpdates,
                        anchor: layoutUpdates.anchor ?? currentLayout.anchor,
                    },
                },
            }
        })
    }, [updateActionPanelsState])

    const applyActionPanelTemplate = useCallback((templateId) => {
        const templateState = cloneActionPanelTemplateState(templateId)

        if (!templateState) {
            return false
        }

        updateActionPanelsState(templateState)
        return true
    }, [updateActionPanelsState])

    const value = useMemo(() => ({
        actionPanelsState,
        updateActionPanelsState,
        resetActionPanelsState,
        addActionPanel,
        removeActionPanel,
        renameActionPanel,
        setActionPanelDisplayStyle,
        setActionPanelItemIds,
        updateActionPanelLayout,
        applyActionPanelTemplate,
    }), [
        actionPanelsState,
        updateActionPanelsState,
        resetActionPanelsState,
        addActionPanel,
        removeActionPanel,
        renameActionPanel,
        setActionPanelDisplayStyle,
        setActionPanelItemIds,
        updateActionPanelLayout,
        applyActionPanelTemplate,
    ])

    return (
        <ActionPanelsContext.Provider value={value}>
            {children}
        </ActionPanelsContext.Provider>
    )
}

export function useActionPanels() {
    const context = useContext(ActionPanelsContext)

    if (!context) {
        throw new Error('useActionPanels must be used inside ActionPanelsProvider')
    }

    return context
}
