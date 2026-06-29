import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    ACTION_PANEL_ITEM_IDS,
    getActionPanelItemDefinition,
    getAvailableAssignableItems,
} from '../../app/tools/actionPanels/actionPanelRegistry.js'
import {
    DRAW_TOOLS_COMPACT_COLUMN_COUNT,
    DRAW_TOOLS_DEFAULT_ITEM_IDS,
    computeDrawToolsPanelPosition,
    estimateDrawToolsPanelHeight,
    estimateDrawToolsPanelSize,
    estimateDrawToolsPanelWidth,
    isPersistedDrawToolsPanel,
    stripDrawToolItemIds,
} from '../../app/tools/actionPanels/drawToolsActionPanel.js'
import {normalizeActionPanelsState} from '../../app/tools/actionPanels/normalizeActionPanels.js'

describe('draw tools panel sizing', () => {
    it('sizes the panel to fit the heading and a single-column tool grid', () => {
        const {width, height} = estimateDrawToolsPanelSize()

        assert.equal(width, estimateDrawToolsPanelWidth())
        assert.equal(DRAW_TOOLS_COMPACT_COLUMN_COUNT, 1)
        assert.equal(
            height,
            estimateDrawToolsPanelHeight(width),
        )
        assert.equal(
            Math.ceil(DRAW_TOOLS_DEFAULT_ITEM_IDS.length / DRAW_TOOLS_COMPACT_COLUMN_COUNT),
            DRAW_TOOLS_DEFAULT_ITEM_IDS.length,
        )
    })
})

describe('draw tools panel positioning', () => {
    it('clamps draw tools panel position within map container bounds', () => {
        const mapContainerRef = {
            current: {
                clientWidth: 800,
                clientHeight: 600,
            },
        }

        const layout = computeDrawToolsPanelPosition({x: 760, y: 560}, mapContainerRef)

        assert.equal(layout.width, estimateDrawToolsPanelWidth())
        assert.equal(layout.height, estimateDrawToolsPanelHeight(layout.width))
        assert.equal(layout.anchor.horizontal.edge, 'right')
        assert.equal(layout.anchor.vertical.edge, 'bottom')
        assert.ok(layout.anchor.horizontal.offset >= 8)
        assert.ok(layout.anchor.vertical.offset >= 8)
    })
})

describe('draw tool registry items', () => {
    it('registers enabled draw shape buttons with icons', () => {
        for (const itemId of DRAW_TOOLS_DEFAULT_ITEM_IDS) {
            const definition = getActionPanelItemDefinition(itemId)

            assert.ok(definition, `missing definition for ${itemId}`)
            assert.notEqual(definition.disabled, true)
            assert.equal(definition.iconKey, itemId)
            assert.equal(definition.assignable, false)
        }
    })

    it('excludes draw tool items from assignable action panel catalog', () => {
        const available = getAvailableAssignableItems([])

        for (const itemId of DRAW_TOOLS_DEFAULT_ITEM_IDS) {
            assert.equal(available.some((item) => item.id === itemId), false)
        }
    })
})

describe('persisted draw tools panel cleanup', () => {
    it('detects draw tools panels saved in action panel cookies', () => {
        assert.equal(isPersistedDrawToolsPanel({
            title: 'Draw Tools',
            itemIds: [],
        }), true)

        assert.equal(isPersistedDrawToolsPanel({
            title: 'Custom Panel',
            itemIds: DRAW_TOOLS_DEFAULT_ITEM_IDS,
        }), true)

        assert.equal(isPersistedDrawToolsPanel({
            title: 'Fixed Function Panel',
            itemIds: [ACTION_PANEL_ITEM_IDS.ZOOM_IN],
        }), false)
    })

    it('strips draw tool items and panels during action panel normalization', () => {
        const normalized = normalizeActionPanelsState({
            panels: [
                {
                    id: 'saved-draw-tools',
                    title: 'Draw Tools',
                    displayStyle: 'compact',
                    itemIds: DRAW_TOOLS_DEFAULT_ITEM_IDS,
                },
                {
                    id: 'mixed-panel',
                    title: 'Mixed Panel',
                    displayStyle: 'large',
                    itemIds: [
                        ACTION_PANEL_ITEM_IDS.ZOOM_IN,
                        ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
                    ],
                },
            ],
            layouts: {
                'saved-draw-tools': {
                    anchor: {
                        horizontal: {edge: 'left', offset: 40},
                        vertical: {edge: 'top', offset: 40},
                    },
                    width: 280,
                    height: null,
                },
                'mixed-panel': {
                    anchor: {
                        horizontal: {edge: 'left', offset: 80},
                        vertical: {edge: 'top', offset: 80},
                    },
                    width: 400,
                    height: null,
                },
            },
        })

        assert.equal(normalized.panels.some((panel) => panel.id === 'saved-draw-tools'), false)
        assert.deepEqual(
            normalized.panels.find((panel) => panel.id === 'mixed-panel')?.itemIds,
            [ACTION_PANEL_ITEM_IDS.ZOOM_IN],
        )
        assert.equal(normalized.layouts['saved-draw-tools'], undefined)
    })

    it('strips draw tool item ids from arbitrary item lists', () => {
        assert.deepEqual(
            stripDrawToolItemIds([
                ACTION_PANEL_ITEM_IDS.HOME,
                ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
            ]),
            [ACTION_PANEL_ITEM_IDS.HOME],
        )
    })
})
