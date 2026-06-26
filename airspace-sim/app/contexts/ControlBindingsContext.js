'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    parseCookieJsonValue,
    readCookieValue,
    writeCookieJsonValue,
} from '@/app/tools/browser/CookieStorage'
import {eventModifierKeysMatchBinding} from '@/app/tools/settings/controlBindingMatchers'

export const CONTROL_BINDINGS_COOKIE_NAME = 'controlBindings'

export const MOUSE_BUTTONS = {
    unbound: -1,
    left: 0,
    middle: 1,
    right: 2,
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
        centerMap: [],
    },
    mapCursor: {
        dragButton: MOUSE_BUTTONS.left,
        grabButton: MOUSE_BUTTONS.left,
        pointerButton: MOUSE_BUTTONS.right,
        centerButton: MOUSE_BUTTONS.middle,
    },
    bearingRangeTool: {
        drawButton: MOUSE_BUTTONS.right,
        contextMenuButton: MOUSE_BUTTONS.right,
        persistModifier: ['shift'],
        contextMenuMaxMs: 250,
        contextMenuMaxPixels: 6,
        minPersistedLinePixels: 24,
    },
}

const KEYBOARD_BINDING_KEYS = [
    'panUp',
    'panLeft',
    'panDown',
    'panRight',
    'panSpeedModifier',
    'centerMap',
]

const MAP_CURSOR_BINDING_KEYS = [
    'dragButton',
    'grabButton',
    'pointerButton',
    'centerButton',
]

const BEARING_RANGE_BINDING_KEYS = [
    'drawButton',
    'contextMenuButton',
]

const BEARING_RANGE_KEYBOARD_BINDING_KEYS = [
    'persistModifier',
]

function clearBindingSection(bindings, bindingKeys) {
    return bindingKeys.reduce((clearedBindings, bindingKey) => ({
        ...clearedBindings,
        [bindingKey]: [],
    }), {...bindings})
}

export const UNBOUND_CONTROL_BINDINGS = {
    keyboardCamera: clearBindingSection(DEFAULT_CONTROL_BINDINGS.keyboardCamera, KEYBOARD_BINDING_KEYS),
    mapCursor: MAP_CURSOR_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
        ...clearedBindings,
        [bindingKey]: MOUSE_BUTTONS.unbound,
    }), {...DEFAULT_CONTROL_BINDINGS.mapCursor}),
    bearingRangeTool: {
        ...BEARING_RANGE_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
            ...clearedBindings,
            [bindingKey]: MOUSE_BUTTONS.unbound,
        }), {...DEFAULT_CONTROL_BINDINGS.bearingRangeTool}),
        ...clearBindingSection(DEFAULT_CONTROL_BINDINGS.bearingRangeTool, BEARING_RANGE_KEYBOARD_BINDING_KEYS),
    },
}

function buildClearedControlBindings(currentBindings) {
    return {
        ...currentBindings,
        keyboardCamera: clearBindingSection(currentBindings.keyboardCamera, KEYBOARD_BINDING_KEYS),
        mapCursor: MAP_CURSOR_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
            ...clearedBindings,
            [bindingKey]: MOUSE_BUTTONS.unbound,
        }), {...currentBindings.mapCursor}),
        bearingRangeTool: {
            ...BEARING_RANGE_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
                ...clearedBindings,
                [bindingKey]: MOUSE_BUTTONS.unbound,
            }), {...currentBindings.bearingRangeTool}),
            ...clearBindingSection(currentBindings.bearingRangeTool, BEARING_RANGE_KEYBOARD_BINDING_KEYS),
        },
    }
}

function normalizeMouseButtonBinding(value, fallbackButton) {
    const parsed = Number(value)

    if (
        parsed === MOUSE_BUTTONS.unbound
        || parsed === MOUSE_BUTTONS.left
        || parsed === MOUSE_BUTTONS.middle
        || parsed === MOUSE_BUTTONS.right
    ) {
        return parsed
    }

    return fallbackButton
}

function normalizeMouseButtonBindings(bindings, bindingKeys, defaultBindings) {
    const mergedBindings = {
        ...defaultBindings,
        ...bindings,
    }

    return bindingKeys.reduce((normalizedBindings, bindingKey) => ({
        ...normalizedBindings,
        [bindingKey]: normalizeMouseButtonBinding(
            bindings?.[bindingKey],
            defaultBindings[bindingKey],
        ),
    }), mergedBindings)
}

function normalizeKey(key) {
    return key.toLowerCase()
}

function normalizeKeyboardBindingKeys(value, fallbackKeys) {
    if (!Array.isArray(value)) {
        return fallbackKeys
    }

    return value
        .filter((key) => typeof key === 'string' && key.length > 0)
        .map((key) => normalizeKey(key))
}

function normalizeBearingRangeToolBindings(bindings) {
    const defaults = DEFAULT_CONTROL_BINDINGS.bearingRangeTool
    const mergedBindings = {
        ...defaults,
        ...bindings,
    }

    return {
        ...normalizeMouseButtonBindings(
            bindings,
            BEARING_RANGE_BINDING_KEYS,
            defaults,
        ),
        persistModifier: normalizeKeyboardBindingKeys(
            bindings?.persistModifier,
            defaults.persistModifier,
        ),
        contextMenuMaxMs: Number.isFinite(Number(bindings?.contextMenuMaxMs))
            ? Number(bindings.contextMenuMaxMs)
            : defaults.contextMenuMaxMs,
        contextMenuMaxPixels: Number.isFinite(Number(bindings?.contextMenuMaxPixels))
            ? Number(bindings.contextMenuMaxPixels)
            : defaults.contextMenuMaxPixels,
        minPersistedLinePixels: Number.isFinite(Number(bindings?.minPersistedLinePixels))
            ? Number(bindings.minPersistedLinePixels)
            : defaults.minPersistedLinePixels,
    }
}

function normalizeBindings(bindings) {
    return {
        ...DEFAULT_CONTROL_BINDINGS, ...bindings, keyboardCamera: {
            ...DEFAULT_CONTROL_BINDINGS.keyboardCamera,
            ...bindings?.keyboardCamera,
        },
        mapCursor: normalizeMouseButtonBindings(
            bindings?.mapCursor,
            MAP_CURSOR_BINDING_KEYS,
            DEFAULT_CONTROL_BINDINGS.mapCursor,
        ),
        bearingRangeTool: normalizeBearingRangeToolBindings(bindings?.bearingRangeTool),
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

    const clearAllControlBindings = useCallback(() => {
        setControlBindings((currentBindings) => {
            const nextBindings = normalizeBindings(buildClearedControlBindings(currentBindings))
            writeControlBindingsCookie(nextBindings)
            return nextBindings
        })
    }, [])

    const value = useMemo(() => ({
        controlBindings,
        updateControlBindings,
        resetControlBindings,
        clearAllControlBindings,
    }), [controlBindings, updateControlBindings, resetControlBindings, clearAllControlBindings])

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

export function pressedKeysMatchBinding(pressedKeys, bindingKeys) {
    return bindingKeys.some((key) => pressedKeys.has(normalizeKey(key)))
}

export function mouseButtonMatchesBinding(eventButton, bindingButton) {
    if (bindingButton === MOUSE_BUTTONS.unbound) {
        return false
    }

    return eventButton === bindingButton
}

export function pressedMouseButtonsMatchBinding(eventButtons, bindingButton) {
    if (bindingButton === MOUSE_BUTTONS.unbound) {
        return false
    }

    const buttonMasks = {
        [MOUSE_BUTTONS.left]: 1,
        [MOUSE_BUTTONS.middle]: 4,
        [MOUSE_BUTTONS.right]: 2,
    }

    return (eventButtons & buttonMasks[bindingButton]) !== 0
}

export function getKeyboardCameraActionForKey(key, keyboardCameraBindings) {
    if (keyMatchesBinding(key, keyboardCameraBindings.panUp)) return 'panUp'
    if (keyMatchesBinding(key, keyboardCameraBindings.panLeft)) return 'panLeft'
    if (keyMatchesBinding(key, keyboardCameraBindings.panDown)) return 'panDown'
    if (keyMatchesBinding(key, keyboardCameraBindings.panRight)) return 'panRight'
    if (keyMatchesBinding(key, keyboardCameraBindings.panSpeedModifier)) return 'panSpeedModifier'

    return null
}

export function getMouseEventButton(event) {
    return event.button ?? event.originalEvent?.button
}

export function getMouseEventButtons(event) {
    return event.buttons ?? event.originalEvent?.buttons ?? 0
}

export function keyMatchesBinding(eventKey, bindingKeys) {
    const normalizedEventKey = normalizeKey(eventKey)

    return bindingKeys.some((key) => normalizeKey(key) === normalizedEventKey)
}

export {eventModifierKeysMatchBinding}