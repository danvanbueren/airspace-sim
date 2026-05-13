'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    parseCookieJsonValue,
    readCookieValue,
    writeCookieJsonValue,
} from '@/app/tools/browser/CookieStorage'

export const CONTROL_BINDINGS_COOKIE_NAME = 'controlBindings'

export const MOUSE_BUTTONS = {
    left: 0, middle: 1, right: 2,
}

export const DEFAULT_CONTROL_BINDINGS = {
    keyboardCamera: {
        panUp: ['w'],
        panLeft: ['a'],
        panDown: ['s'],
        panRight: ['d'],
        panSpeedModifier: ['shift'],
        panSpeedMultiplier: 2.5,
        regularPanSpeed: 1000,
    }, bearingRangeTool: {
        drawButton: MOUSE_BUTTONS.right,
        contextMenuButton: MOUSE_BUTTONS.right,
        contextMenuMaxMs: 250,
        contextMenuMaxPixels: 6,
        minPersistedLinePixels: 24,
    },
}

function normalizeKey(key) {
    return key.toLowerCase()
}

function normalizeBindings(bindings) {
    return {
        ...DEFAULT_CONTROL_BINDINGS, ...bindings, keyboardCamera: {
            ...DEFAULT_CONTROL_BINDINGS.keyboardCamera, ...bindings?.keyboardCamera,
        }, bearingRangeTool: {
            ...DEFAULT_CONTROL_BINDINGS.bearingRangeTool, ...bindings?.bearingRangeTool,
        },
    }
}

function parseInitialBindings(initialBindings) {
    return normalizeBindings(parseCookieJsonValue(initialBindings, DEFAULT_CONTROL_BINDINGS))
}

function readBrowserBindings() {
    return normalizeBindings(parseCookieJsonValue(
        readCookieValue(CONTROL_BINDINGS_COOKIE_NAME),
        DEFAULT_CONTROL_BINDINGS
    ))
}

const ControlBindingsContext = createContext(null)

function writeControlBindingsCookie(controlBindings) {
    writeCookieJsonValue(CONTROL_BINDINGS_COOKIE_NAME, controlBindings)
}

export function ControlBindingsProvider({children, initialBindings}) {
    const [controlBindings, setControlBindings] = useState(() => parseInitialBindings(initialBindings))

    useEffect(() => {
        const browserBindings = readBrowserBindings()

        setControlBindings((currentBindings) => {
            const currentJson = JSON.stringify(currentBindings)
            const browserJson = JSON.stringify(browserBindings)

            return currentJson === browserJson ? currentBindings : browserBindings
        })
    }, [])

    const updateControlBindings = useCallback((updater) => {
        setControlBindings((currentBindings) => {
            const nextBindings = typeof updater === 'function' ? updater(currentBindings) : updater
            const normalizedBindings = normalizeBindings(nextBindings)
            writeControlBindingsCookie(normalizedBindings)
            return normalizedBindings
        })
    }, [])

    const resetControlBindings = useCallback(() => {
        writeControlBindingsCookie(DEFAULT_CONTROL_BINDINGS)
        setControlBindings(DEFAULT_CONTROL_BINDINGS)
    }, [])

    const value = useMemo(() => ({
        controlBindings, updateControlBindings, resetControlBindings,
    }), [controlBindings, updateControlBindings, resetControlBindings])

    return (<ControlBindingsContext.Provider value={value}>
        {children}
    </ControlBindingsContext.Provider>)
}

export function useControlBindings() {
    const context = useContext(ControlBindingsContext)

    if (!context) {
        throw new Error('useControlBindings must be used inside ControlBindingsProvider')
    }

    return context
}

export function keyMatchesBinding(eventKey, bindingKeys) {
    const normalizedEventKey = normalizeKey(eventKey)

    return bindingKeys.some((key) => normalizeKey(key) === normalizedEventKey)
}

export function pressedKeysMatchBinding(pressedKeys, bindingKeys) {
    return bindingKeys.some((key) => pressedKeys.has(normalizeKey(key)))
}

export function getKeyboardCameraActionForKey(key, keyboardCameraBindings) {
    if (keyMatchesBinding(key, keyboardCameraBindings.panUp)) return 'panUp'
    if (keyMatchesBinding(key, keyboardCameraBindings.panLeft)) return 'panLeft'
    if (keyMatchesBinding(key, keyboardCameraBindings.panDown)) return 'panDown'
    if (keyMatchesBinding(key, keyboardCameraBindings.panRight)) return 'panRight'
    if (keyMatchesBinding(key, keyboardCameraBindings.panSpeedModifier)) return 'panSpeedModifier'

    return null
}