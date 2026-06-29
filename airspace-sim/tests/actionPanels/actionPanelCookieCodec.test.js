import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    DEFAULT_ACTION_PANELS_STATE,
    MAX_ACTION_PANEL_COUNT,
} from '../../app/tools/actionPanels/actionPanelDefaults.js'
import {
    createEmptyActionPanel,
    normalizeActionPanelsState,
} from '../../app/tools/actionPanels/normalizeActionPanels.js'
import {ACTION_PANEL_ITEM_IDS} from '../../app/tools/actionPanels/actionPanelRegistry.js'
import {
    decodeActionPanelsFromCookie,
    encodeActionPanelsForCookie,
    getEncodedActionPanelsCookieByteLength,
} from '../../app/tools/actionPanels/actionPanelCookieCodec.js'

const BROWSER_COOKIE_VALUE_BYTE_LIMIT = 4096

function buildMaxActionPanelsState({withItems = false} = {}) {
    let state = structuredClone(DEFAULT_ACTION_PANELS_STATE)
    const allItems = Object.values(ACTION_PANEL_ITEM_IDS)

    while (state.panels.length < MAX_ACTION_PANEL_COUNT) {
        const {panel, layout} = createEmptyActionPanel({
            title: `Panel ${state.panels.length + 1}`,
            existingLayouts: state.layouts,
        })

        if (withItems) {
            panel.itemIds = allItems.slice(0, 6)
        }

        state.panels.push(panel)
        state.layouts[panel.id] = layout
    }

    return normalizeActionPanelsState(state)
}

describe('actionPanelCookieCodec', () => {
    it('round-trips the default panels through the compact cookie format', () => {
        const encoded = encodeActionPanelsForCookie(DEFAULT_ACTION_PANELS_STATE)
        const decoded = decodeActionPanelsFromCookie(encoded, DEFAULT_ACTION_PANELS_STATE)

        assert.deepEqual(decoded, normalizeActionPanelsState(DEFAULT_ACTION_PANELS_STATE))
        assert.equal(encoded.v, 1)
        assert.ok(Array.isArray(encoded.p))
        assert.ok(Array.isArray(encoded.l))
    })

    it('round-trips nine fully populated panels and stays under the browser cookie limit', () => {
        const state = buildMaxActionPanelsState({withItems: true})
        const encoded = encodeActionPanelsForCookie(state)
        const decoded = decodeActionPanelsFromCookie(encoded, DEFAULT_ACTION_PANELS_STATE)

        assert.equal(decoded.panels.length, MAX_ACTION_PANEL_COUNT)
        assert.deepEqual(decoded, state)
        assert.ok(getEncodedActionPanelsCookieByteLength(state) < BROWSER_COOKIE_VALUE_BYTE_LIMIT)
    })

    it('still reads legacy expanded cookie payloads', () => {
        const legacyState = buildMaxActionPanelsState({withItems: false})
        const decoded = decodeActionPanelsFromCookie(legacyState, DEFAULT_ACTION_PANELS_STATE)

        assert.deepEqual(decoded, legacyState)
    })

    it('uses compact encoding that is smaller than the legacy JSON payload for nine panels', () => {
        const state = buildMaxActionPanelsState({withItems: false})
        const compactEncodedLength = getEncodedActionPanelsCookieByteLength(state)
        const legacyEncodedLength = encodeURIComponent(JSON.stringify(state)).length

        assert.ok(compactEncodedLength < legacyEncodedLength)
        assert.equal(legacyEncodedLength, BROWSER_COOKIE_VALUE_BYTE_LIMIT)
        assert.ok(compactEncodedLength < BROWSER_COOKIE_VALUE_BYTE_LIMIT)
    })
})
