const MOUSE_BUTTONS = {
    unbound: -1,
    left: 0,
    middle: 1,
    right: 2,
}

function formatKeyList(keys) {
    if (!keys?.length) {
        return 'Unbound'
    }

    const labels = {
        ' ': 'Space',
        arrowup: 'Arrow Up',
        arrowleft: 'Arrow Left',
        arrowdown: 'Arrow Down',
        arrowright: 'Arrow Right',
        escape: 'Escape',
        shift: 'Shift',
        control: 'Control',
        alt: 'Alt',
        meta: 'Meta',
    }

    return keys.map((key) => labels[key.toLowerCase()] ?? key.toUpperCase()).join(' + ')
}

function getMouseButtonLabel(button) {
    const labels = {
        [MOUSE_BUTTONS.unbound]: 'Unbound',
        [MOUSE_BUTTONS.left]: 'Left Mouse',
        [MOUSE_BUTTONS.middle]: 'Middle Mouse',
        [MOUSE_BUTTONS.right]: 'Right Mouse',
    }

    return labels[button] ?? 'Unbound'
}

function mouseCombo(button, action = 'drag') {
    const label = getMouseButtonLabel(button)

    if (button === MOUSE_BUTTONS.unbound) {
        return 'Unbound'
    }

    return `${label} + ${action}`
}

function mouseClick(button) {
    const label = getMouseButtonLabel(button)

    if (button === MOUSE_BUTTONS.unbound) {
        return 'Unbound'
    }

    return `${label} click`
}

function mouseHold(button) {
    const label = getMouseButtonLabel(button)

    if (button === MOUSE_BUTTONS.unbound) {
        return 'Unbound'
    }

    return `${label} hold`
}

function buildBearingRangeReferenceEntries(bearingRangeTool, bearingRangeBehavior) {
    const persistModifierLabel = formatKeyList(bearingRangeTool.persistModifier)
    const drawCombo = mouseCombo(bearingRangeTool.drawButton)

    switch (bearingRangeBehavior) {
        case 'permanent_default':
            return [
                {
                    action: 'Measure bearing/range (temporary)',
                    combo: persistModifierLabel === 'Unbound'
                        ? 'Unavailable — no temporary-only measurements'
                        : `${drawCombo} + hold ${persistModifierLabel} on release`,
                    notes: 'Uses the persist line modifier binding',
                },
                {
                    action: 'Keep bearing/range line on map',
                    combo: drawCombo,
                    notes: 'Lines stay on the map unless the persist modifier is held on release',
                },
            ]
        case 'always_permanent':
            return [
                {
                    action: 'Measure and keep bearing/range line',
                    combo: drawCombo,
                    notes: 'Every measurement is kept on the map',
                },
            ]
        case 'never_permanent':
            return [
                {
                    action: 'Measure bearing/range (temporary)',
                    combo: drawCombo,
                    notes: 'Measurements always disappear on release',
                },
            ]
        case 'temporary_default':
        default:
            return [
                {
                    action: 'Measure bearing/range (temporary)',
                    combo: drawCombo,
                    notes: 'Disappears on release unless the persist modifier is held',
                },
                {
                    action: 'Keep bearing/range line on map',
                    combo: persistModifierLabel === 'Unbound'
                        ? 'Unbound — no permanent lines'
                        : `${drawCombo} + hold ${persistModifierLabel} on release`,
                    notes: 'Uses the persist line modifier binding',
                },
            ]
    }
}

export function buildControlReference(controlBindings, {bearingRangeBehavior = 'temporary_default'} = {}) {
    const {keyboardCamera, mapCursor, bearingRangeTool} = controlBindings
    const centerKeyLabel = formatKeyList(keyboardCamera.centerMap)
    const panSpeedModifierLabel = formatKeyList(keyboardCamera.panSpeedModifier)

    return [
        {
            title: 'Keyboard Camera',
            entries: [
                {
                    action: 'Pan north',
                    combo: formatKeyList(keyboardCamera.panUp),
                },
                {
                    action: 'Pan east',
                    combo: formatKeyList(keyboardCamera.panRight),
                },
                {
                    action: 'Pan south',
                    combo: formatKeyList(keyboardCamera.panDown),
                },
                {
                    action: 'Pan west',
                    combo: formatKeyList(keyboardCamera.panLeft),
                },
                {
                    action: 'Modify Pan Speed',
                    combo: `${panSpeedModifierLabel} + movement keys`,
                    notes: 'Uses the speed modifier binding',
                },
                {
                    action: 'Center map at cursor',
                    combo: centerKeyLabel === 'Unbound'
                        ? mouseClick(mapCursor.centerButton)
                        : `${centerKeyLabel} or ${mouseClick(mapCursor.centerButton)}`,
                    notes: centerKeyLabel === 'Unbound'
                        ? 'Center map key is unbound; use the mouse button'
                        : undefined,
                },
            ],
        },
        {
            title: 'Mouse Map Navigation',
            entries: [
                {
                    action: 'Pan map',
                    combo: mouseCombo(mapCursor.dragButton),
                },
                {
                    action: 'Box zoom to area',
                    combo: 'Shift + Left Mouse + drag',
                    notes: 'Fixed — not rebindable today',
                },
                {
                    action: 'Center map at cursor',
                    combo: mouseClick(mapCursor.centerButton),
                },
                {
                    action: 'Zoom in or out',
                    combo: 'Scroll wheel',
                    notes: 'Fixed — not rebindable today; also use Action Panel zoom buttons',
                },
            ],
        },
        {
            title: 'Tracks',
            entries: [
                {
                    action: 'Open Track Management window',
                    combo: `${mouseClick(mapCursor.grabButton)} on track`,
                },
                {
                    action: 'Dismiss transient track windows',
                    combo: `${mouseClick(mapCursor.grabButton)} on empty map`,
                    notes: 'Persistent windows stay until closed',
                },
                {
                    action: 'Pointer cursor',
                    combo: mouseHold(mapCursor.pointerButton),
                },
            ],
        },
        {
            title: 'Bearing/Range Lines',
            entries: [
                ...buildBearingRangeReferenceEntries(bearingRangeTool, bearingRangeBehavior),
                {
                    action: 'Open map context menu',
                    combo: mouseClick(bearingRangeTool.contextMenuButton),
                    notes: 'Short click; sensitivity limits apply',
                },
                {
                    action: 'Open line context menu',
                    combo: `${mouseClick(bearingRangeTool.contextMenuButton)} on line`,
                    notes: 'Hit-tests permanent lines only',
                },
            ],
        },
        {
            title: 'Track Management Windows',
            entries: [
                {
                    action: 'Focus window for keyboard input',
                    combo: 'Click window header or body',
                    notes: 'Claims keyboard custody; disables map camera keys',
                },
                {
                    action: 'Commit text field edits',
                    combo: 'Enter or click away',
                    notes: 'Deferred text field pattern; Enter blurs',
                },
            ],
        },
        {
            title: 'Fixed Controls',
            entries: [
                {
                    action: 'Box zoom mode cursor',
                    combo: 'Shift held over map',
                    notes: 'Fixed — not rebindable today',
                },
                {
                    action: 'Zoom in',
                    combo: 'Action Panel → Zoom In',
                },
                {
                    action: 'Zoom out',
                    combo: 'Fixed Function Panel → Zoom Out',
                },
            ],
        },
    ]
}
