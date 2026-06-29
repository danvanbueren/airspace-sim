'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    parseCookieJsonValue,
    readCookieValue,
    writeCookieJsonValue,
} from '@/app/tools/browser/CookieStorage'
import {eventModifierKeysMatchBinding} from '@/app/tools/settings/controlBindingMatchers'
import {
    buildClearedControlBindings,
    CONTROL_BINDING_KEY_GROUPS,
    DEFAULT_CONTROL_BINDINGS,
    MOUSE_BUTTONS,
} from '@/app/tools/settings/controlBindingsDefaults'

export const CONTROL_BINDINGS_COOKIE_NAME = 'controlBindings'

export {DEFAULT_CONTROL_BINDINGS, MOUSE_BUTTONS, UNBOUND_CONTROL_BINDINGS} from '@/app/tools/settings/controlBindingsDefaults'

const {
    mapCursor: MAP_CURSOR_BINDING_KEYS,
    bearingRangeMouse: BEARING_RANGE_BINDING_KEYS,
} = CONTROL_BINDING_KEY_GROUPS

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

function normalizeScopeToolBindings(bindings) {
    const defaults = DEFAULT_CONTROL_BINDINGS.scopeTool
    const mergedBindings = {
        ...defaults,
        ...bindings,
    }

    return {
        ...mergedBindings,
        toggleGroupCriteriaCircle: normalizeKeyboardBindingKeys(
            bindings?.toggleGroupCriteriaCircle,
            defaults.toggleGroupCriteriaCircle,
        ),
    }
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
        scopeTool: normalizeScopeToolBindings(bindings?.scopeTool),
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