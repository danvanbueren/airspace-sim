import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from '../../app/actionPanels/actionPanelRegistry.js'
import {
    DEFAULT_CATEGORY_SELECT_PANEL_ID,
    DEFAULT_FIXED_FUNCTION_PANEL_ID,
} from '../../app/actionPanels/actionPanelDefaults.js'
import {
    createEmptyActionPanel,
    normalizeActionPanelsState,
} from '../../app/actionPanels/normalizeActionPanels.js'

describe('normalizeActionPanelsState', () => {
    it('returns the default Category Select and Fixed Function panels', () => {
        const normalized = normalizeActionPanelsState(undefined)

        assert.equal(normalized.panels.length, 2)
        assert.equal(normalized.panels[0].id, DEFAULT_CATEGORY_SELECT_PANEL_ID)
        assert.equal(normalized.panels[0].title, 'Category Select Panel')
        assert.equal(normalized.panels[0].displayStyle, ACTION_PANEL_DISPLAY_STYLES.LARGE)
        assert.deepEqual(normalized.panels[0].itemIds, [
            ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
            ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
            ACTION_PANEL_ITEM_IDS.SPACER,
            ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
            ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
            ACTION_PANEL_ITEM_IDS.SPACER,
            ACTION_PANEL_ITEM_IDS.AIRPORTS,
            ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
        ])

        assert.equal(normalized.panels[1].id, DEFAULT_FIXED_FUNCTION_PANEL_ID)
        assert.equal(normalized.panels[1].title, 'Fixed Function Panel')

        assert.equal(normalized.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID].width, 400)
        assert.equal(normalized.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID].anchor.vertical.edge, 'top')
        assert.equal(normalized.layouts[DEFAULT_FIXED_FUNCTION_PANEL_ID].anchor.vertical.edge, 'bottom')
    })

    it('drops unknown items and clamps panel width', () => {
        const normalized = normalizeActionPanelsState({
            panels: [{
                id: 'custom-panel',
                title: 'Custom Panel',
                displayStyle: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
                itemIds: ['NOT_REAL', ACTION_PANEL_ITEM_IDS.ZOOM_IN],
            }],
            layouts: {
                'custom-panel': {
                    anchor: {
                        horizontal: {edge: 'right', offset: 40},
                        vertical: {edge: 'bottom', offset: 50},
                    },
                    width: 999,
                },
            },
        })

        assert.equal(normalized.panels.length, 1)
        assert.deepEqual(normalized.panels[0].itemIds, [ACTION_PANEL_ITEM_IDS.ZOOM_IN])
        assert.equal(normalized.layouts['custom-panel'].width, 720)
        assert.equal(normalized.layouts['custom-panel'].anchor.horizontal.edge, 'right')
    })

    it('creates a new panel with a default layout', () => {
        const created = createEmptyActionPanel({title: 'Ops Panel'})

        assert.match(created.panel.id, /^action-panel-/)
        assert.equal(created.panel.title, 'Ops Panel')
        assert.equal(created.layout.width, 400)
        assert.equal(created.layout.anchor.horizontal.edge, 'left')
    })
})
