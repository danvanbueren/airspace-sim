import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    normalizeLayoutForViewport,
    resolveViewportLayoutFromAnchor,
    runtimeLayoutDiffersFromStored,
    viewportDimensionsDifferFromStored,
    viewportLayoutDiffersFromStored,
} from '../../app/tools/actionPanels/actionPanelViewportLayout.js'
import {estimateActionPanelAutoHeight} from '../../app/tools/actionPanels/actionPanelSizeEstimate.js'
import {ACTION_PANEL_MIN_WIDTH_PX} from '../../app/tools/actionPanels/normalizeActionPanels.js'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from '../../app/tools/actionPanels/actionPanelRegistry.js'

describe('normalizeLayoutForViewport', () => {
    it('keeps in-bounds layouts unchanged', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'top', offset: 20},
            },
            width: 400,
            height: null,
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 1200, height: 800})

        assert.equal(normalized.width, 400)
        assert.equal(normalized.height, null)
        assert.equal(normalized.position.left, 20)
        assert.equal(normalized.position.top, 20)
    })

    it('pulls bottom-anchored panels back into the viewport', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'bottom', offset: 20},
            },
            width: 400,
            height: null,
        }
        const resolvedPanelSize = {
            width: 400,
            height: estimateActionPanelAutoHeight({
                itemIds: [
                    ACTION_PANEL_ITEM_IDS.ZOOM_IN,
                    ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
                    ACTION_PANEL_ITEM_IDS.HOME,
                    ACTION_PANEL_ITEM_IDS.CENTER_E3,
                    ACTION_PANEL_ITEM_IDS.INITIATE,
                    ACTION_PANEL_ITEM_IDS.RE_INITIATE,
                ],
                displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
                panelWidthPx: 400,
            }),
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 320, height: 240}, {
            resolvedPanelSize,
        })

        assert.ok(normalized.position.top >= 8)
        assert.ok(normalized.position.left >= 8)
        assert.ok(normalized.width <= 320)
        assert.equal(normalized.position.top, 8)
    })

    it('shrinks widths that exceed the available viewport', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'top', offset: 20},
            },
            width: 900,
            height: null,
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 360, height: 800})

        assert.ok(normalized.width < 900)
        assert.ok(normalized.width >= ACTION_PANEL_MIN_WIDTH_PX)
        assert.ok(normalized.position.left + normalized.width <= 360)
    })

    it('detects when runtime panel dimensions diverge from stored props', () => {
        const storedLayout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'top', offset: 20},
            },
            width: 400,
            height: null,
        }
        const runtimeLayout = {
            ...storedLayout,
            width: 640,
            height: 320,
        }

        assert.equal(runtimeLayoutDiffersFromStored(runtimeLayout, storedLayout), true)
        assert.equal(runtimeLayoutDiffersFromStored(storedLayout, storedLayout), false)
    })

    it('reports when a stored layout needs correction', () => {
        const storedLayout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'bottom', offset: 20},
            },
            width: 900,
            height: 240,
        }
        const normalizedLayout = normalizeLayoutForViewport(storedLayout, {width: 360, height: 240})

        assert.equal(
            viewportLayoutDiffersFromStored(storedLayout, normalizedLayout),
            true,
        )
    })

    it('preserves the stored edge anchor when resolving a clamped viewport layout', () => {
        const anchor = {
            horizontal: {edge: 'right', offset: 20},
            vertical: {edge: 'bottom', offset: 56},
        }
        const layout = {
            anchor,
            width: 300,
            height: 200,
        }

        const shrunk = resolveViewportLayoutFromAnchor(
            layout.anchor,
            layout.width,
            layout.height,
            {width: 500, height: 400},
            {
                resolvedPanelSize: {width: 300, height: 200},
            },
        )

        assert.deepEqual(shrunk.anchor, anchor)
        assert.ok(shrunk.position.top >= 8)
        assert.ok(shrunk.position.left >= 8)

        const expanded = resolveViewportLayoutFromAnchor(
            layout.anchor,
            layout.width,
            layout.height,
            {width: 1000, height: 800},
            {
                resolvedPanelSize: {width: 300, height: 200},
            },
        )

        assert.deepEqual(expanded.anchor, anchor)
        assert.equal(expanded.position.left, 1000 - 300 - 20)
        assert.equal(expanded.position.top, 800 - 200 - 56)
    })

    it('only flags dimension changes when comparing stored viewport corrections', () => {
        const storedLayout = {
            anchor: {
                horizontal: {edge: 'right', offset: 20},
                vertical: {edge: 'bottom', offset: 56},
            },
            width: 900,
            height: 240,
        }
        const normalizedLayout = resolveViewportLayoutFromAnchor(
            storedLayout.anchor,
            storedLayout.width,
            storedLayout.height,
            {width: 360, height: 240},
        )

        assert.equal(viewportDimensionsDifferFromStored(storedLayout, normalizedLayout), true)
        assert.equal(viewportLayoutDiffersFromStored(storedLayout, normalizedLayout), true)
        assert.deepEqual(normalizedLayout.anchor, storedLayout.anchor)
    })

    it('preserves panel dimensions while only updating position during active resize', () => {
        const anchor = {
            horizontal: {edge: 'right', offset: 20},
            vertical: {edge: 'bottom', offset: 56},
        }

        const preservedLayout = resolveViewportLayoutFromAnchor(
            anchor,
            400,
            320,
            {width: 360, height: 240},
            {
                preserveDimensions: true,
                resolvedPanelSize: {width: 400, height: 320},
            },
        )

        assert.equal(preservedLayout.width, 400)
        assert.equal(preservedLayout.height, 320)
        assert.ok(preservedLayout.position.top >= 8)
    })
})
