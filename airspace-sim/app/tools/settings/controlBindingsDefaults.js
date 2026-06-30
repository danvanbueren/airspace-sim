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
        centerMap: ['f'],
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
    scopeTool: {
        toggleGroupCriteriaCircle: ['capslock'],
    },
    drawGeometryTool: {
        cancelButton: ['escape'],
        completePolygonButton: ['enter'],
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

const SCOPE_TOOL_KEYBOARD_BINDING_KEYS = [
    'toggleGroupCriteriaCircle',
]

const DRAW_GEOMETRY_KEYBOARD_BINDING_KEYS = [
    'cancelButton',
    'completePolygonButton',
]

function clearBindingSection(bindings, bindingKeys) {
    return bindingKeys.reduce((clearedBindings, bindingKey) => ({
        ...clearedBindings,
        [bindingKey]: [],
    }), {...bindings})
}

function clearBearingRangeToolBindings(bearingRangeTool) {
    return {
        ...bearingRangeTool,
        ...clearBindingSection(bearingRangeTool, BEARING_RANGE_KEYBOARD_BINDING_KEYS),
        ...BEARING_RANGE_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
            ...clearedBindings,
            [bindingKey]: MOUSE_BUTTONS.unbound,
        }), {}),
    }
}

export const UNBOUND_CONTROL_BINDINGS = {
    keyboardCamera: clearBindingSection(DEFAULT_CONTROL_BINDINGS.keyboardCamera, KEYBOARD_BINDING_KEYS),
    mapCursor: MAP_CURSOR_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
        ...clearedBindings,
        [bindingKey]: MOUSE_BUTTONS.unbound,
    }), {...DEFAULT_CONTROL_BINDINGS.mapCursor}),
    bearingRangeTool: clearBearingRangeToolBindings(DEFAULT_CONTROL_BINDINGS.bearingRangeTool),
    scopeTool: clearBindingSection(DEFAULT_CONTROL_BINDINGS.scopeTool, SCOPE_TOOL_KEYBOARD_BINDING_KEYS),
    drawGeometryTool: clearBindingSection(DEFAULT_CONTROL_BINDINGS.drawGeometryTool, DRAW_GEOMETRY_KEYBOARD_BINDING_KEYS),
}

export function buildClearedControlBindings(currentBindings) {
    return {
        ...currentBindings,
        keyboardCamera: clearBindingSection(currentBindings.keyboardCamera, KEYBOARD_BINDING_KEYS),
        mapCursor: MAP_CURSOR_BINDING_KEYS.reduce((clearedBindings, bindingKey) => ({
            ...clearedBindings,
            [bindingKey]: MOUSE_BUTTONS.unbound,
        }), {...currentBindings.mapCursor}),
        bearingRangeTool: clearBearingRangeToolBindings(currentBindings.bearingRangeTool),
        scopeTool: clearBindingSection(currentBindings.scopeTool, SCOPE_TOOL_KEYBOARD_BINDING_KEYS),
        drawGeometryTool: clearBindingSection(currentBindings.drawGeometryTool, DRAW_GEOMETRY_KEYBOARD_BINDING_KEYS),
    }
}

export const CONTROL_BINDING_KEY_GROUPS = {
    keyboardCamera: KEYBOARD_BINDING_KEYS,
    mapCursor: MAP_CURSOR_BINDING_KEYS,
    bearingRangeMouse: BEARING_RANGE_BINDING_KEYS,
    bearingRangeKeyboard: BEARING_RANGE_KEYBOARD_BINDING_KEYS,
    scopeToolKeyboard: SCOPE_TOOL_KEYBOARD_BINDING_KEYS,
    drawGeometryKeyboard: DRAW_GEOMETRY_KEYBOARD_BINDING_KEYS,
}
