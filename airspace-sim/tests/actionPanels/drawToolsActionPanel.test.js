import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
    getActionPanelItemDefinition,
} from '../../app/tools/actionPanels/actionPanelRegistry.js'
import {
    DRAW_TOOLS_DEFAULT_ITEM_IDS,
    DRAW_TOOLS_PANEL_TITLE,
    DRAW_TOOLS_PANEL_WIDTH_PX,
    computeDrawToolsPanelPosition,
    createDrawToolsActionPanel,
} from '../../app/tools/actionPanels/drawToolsActionPanel.js'

describe('draw tools action panel', () => {
    it('creates a compact panel with all draw shape items', () => {
        const anchor = {
            horizontal: {edge: 'left', offset: 120},
            vertical: {edge: 'top', offset: 80},
        }
        const {panel, layout} = createDrawToolsActionPanel({anchor})

        assert.equal(panel.title, DRAW_TOOLS_PANEL_TITLE)
        assert.equal(panel.displayStyle, ACTION_PANEL_DISPLAY_STYLES.COMPACT)
        assert.deepEqual(panel.itemIds, DRAW_TOOLS_DEFAULT_ITEM_IDS)
        assert.equal(layout.width, DRAW_TOOLS_PANEL_WIDTH_PX)
        assert.equal(layout.anchor, anchor)
    })

    it('clamps draw tools panel position within map container bounds', () => {
        const mapContainerRef = {
            current: {
                clientWidth: 800,
                clientHeight: 600,
            },
        }

        const layout = computeDrawToolsPanelPosition({x: 760, y: 560}, mapContainerRef)

        assert.equal(layout.width, DRAW_TOOLS_PANEL_WIDTH_PX)
        assert.equal(layout.anchor.horizontal.edge, 'right')
        assert.equal(layout.anchor.vertical.edge, 'bottom')
        assert.ok(layout.anchor.horizontal.offset >= 8)
        assert.ok(layout.anchor.vertical.offset >= 8)
    })
})

describe('draw tool registry items', () => {
    it('registers disabled draw shape buttons with icons', () => {
        for (const itemId of DRAW_TOOLS_DEFAULT_ITEM_IDS) {
            const definition = getActionPanelItemDefinition(itemId)

            assert.ok(definition, `missing definition for ${itemId}`)
            assert.equal(definition.disabled, true)
            assert.equal(definition.iconKey, itemId)
        }
    })

    it('includes all expected draw tool item ids', () => {
        assert.deepEqual(DRAW_TOOLS_DEFAULT_ITEM_IDS, [
            ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
            ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
            ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
            ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
            ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
            ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
        ])
    })
})
