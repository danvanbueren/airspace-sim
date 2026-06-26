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

export function buildControlReference(controlBindings) {
    const {keyboardCamera, mapCursor, bearingRangeTool} = controlBindings
    const persistModifierLabel = formatKeyList(bearingRangeTool.persistModifier)
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
                    action: 'Pan faster',
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
                    notes: 'Fixed — not rebindable today; also use Fixed Function Panel buttons',
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
                {
                    action: 'Measure bearing/range (temporary)',
                    combo: mouseCombo(bearingRangeTool.drawButton),
                    notes: 'Disappears on release unless the persist modifier is held',
                },
                {
                    action: 'Keep bearing/range line on map',
                    combo: persistModifierLabel === 'Unbound'
                        ? 'Unbound — no permanent lines'
                        : `${mouseCombo(bearingRangeTool.drawButton)} + hold ${persistModifierLabel} on release`,
                    notes: 'Uses the persist line modifier binding',
                },
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
                    combo: 'Fixed Function Panel → Zoom In',
                },
                {
                    action: 'Zoom out',
                    combo: 'Fixed Function Panel → Zoom Out',
                },
            ],
        },
    ]
}
