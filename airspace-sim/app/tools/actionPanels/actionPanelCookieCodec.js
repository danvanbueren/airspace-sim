import {ACTION_PANEL_DISPLAY_STYLES} from './actionPanelRegistry.js'
import {normalizeActionPanelsState} from './normalizeActionPanels.js'

const COMPACT_FORMAT_VERSION = 1

const DISPLAY_STYLE_TO_CODE = {
    [ACTION_PANEL_DISPLAY_STYLES.LARGE]: 0,
    [ACTION_PANEL_DISPLAY_STYLES.COMPACT]: 1,
}

const DISPLAY_STYLE_FROM_CODE = {
    0: ACTION_PANEL_DISPLAY_STYLES.LARGE,
    1: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
}

const HORIZONTAL_EDGE_TO_CODE = {
    left: 0,
    right: 1,
}

const HORIZONTAL_EDGE_FROM_CODE = {
    0: 'left',
    1: 'right',
}

const VERTICAL_EDGE_TO_CODE = {
    top: 0,
    bottom: 1,
}

const VERTICAL_EDGE_FROM_CODE = {
    0: 'top',
    1: 'bottom',
}

function isCompactActionPanelsCookie(value) {
    return value?.v === COMPACT_FORMAT_VERSION
        && Array.isArray(value.p)
        && Array.isArray(value.l)
}

function isLegacyActionPanelsCookie(value) {
    return Array.isArray(value?.panels)
}

function decodeCompactActionPanelsCookie(value) {
    const panels = value.p.map((panelTuple, index) => {
        const [
            id,
            title,
            displayStyleCode,
            itemIds,
        ] = panelTuple ?? []

        return {
            id,
            title,
            displayStyle: DISPLAY_STYLE_FROM_CODE[displayStyleCode]
                ?? ACTION_PANEL_DISPLAY_STYLES.LARGE,
            itemIds: Array.isArray(itemIds) ? itemIds : [],
        }
    })

    const layouts = {}

    panels.forEach((panel, index) => {
        const layoutTuple = value.l[index]

        if (!Array.isArray(layoutTuple)) {
            return
        }

        const [
            horizontalEdgeCode,
            horizontalOffset,
            verticalEdgeCode,
            verticalOffset,
            width,
            height,
        ] = layoutTuple

        layouts[panel.id] = {
            anchor: {
                horizontal: {
                    edge: HORIZONTAL_EDGE_FROM_CODE[horizontalEdgeCode] ?? 'left',
                    offset: horizontalOffset,
                },
                vertical: {
                    edge: VERTICAL_EDGE_FROM_CODE[verticalEdgeCode] ?? 'top',
                    offset: verticalOffset,
                },
            },
            width,
            height: height ?? null,
        }
    })

    return {panels, layouts}
}

export function encodeActionPanelsForCookie(actionPanelsState) {
    const normalizedState = normalizeActionPanelsState(actionPanelsState)

    return {
        v: COMPACT_FORMAT_VERSION,
        p: normalizedState.panels.map((panel) => ([
            panel.id,
            panel.title,
            DISPLAY_STYLE_TO_CODE[panel.displayStyle] ?? 0,
            panel.itemIds,
        ])),
        l: normalizedState.panels.map((panel) => {
            const layout = normalizedState.layouts[panel.id]
            const anchor = layout.anchor

            return [
                HORIZONTAL_EDGE_TO_CODE[anchor.horizontal.edge] ?? 0,
                anchor.horizontal.offset,
                VERTICAL_EDGE_TO_CODE[anchor.vertical.edge] ?? 0,
                anchor.vertical.offset,
                layout.width,
                layout.height,
            ]
        }),
    }
}

export function decodeActionPanelsFromCookie(value, fallbackValue) {
    if (!value) {
        return normalizeActionPanelsState(fallbackValue)
    }

    if (isCompactActionPanelsCookie(value)) {
        return normalizeActionPanelsState(decodeCompactActionPanelsCookie(value))
    }

    if (isLegacyActionPanelsCookie(value)) {
        return normalizeActionPanelsState(value)
    }

    return normalizeActionPanelsState(fallbackValue)
}

export function getEncodedActionPanelsCookieByteLength(actionPanelsState) {
    const encodedValue = encodeURIComponent(JSON.stringify(
        encodeActionPanelsForCookie(actionPanelsState),
    ))

    return encodedValue.length
}
