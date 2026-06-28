import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from '../../app/tools/actionPanels/actionPanelRegistry.js'
import {
    getCompactGridColumnCount,
    getLargeGridColumnCount,
} from '../../app/tools/actionPanels/actionPanelGridLayout.js'
import {
    DEFAULT_CATEGORY_SELECT_PANEL_ID,
    DEFAULT_FIXED_FUNCTION_PANEL_ID,
} from '../../app/tools/actionPanels/actionPanelDefaults.js'
import {MAP_FLOATING_INSET_PX} from '../../app/constants/mapUiLayout.js'
import {
    ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX,
    createEmptyActionPanel,
    createNewActionPanelLayout,
    normalizeActionPanelsState,
} from '../../app/tools/actionPanels/normalizeActionPanels.js'

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
            ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
            ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
            ACTION_PANEL_ITEM_IDS.AIRPORTS,
            ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
        ])

        assert.equal(normalized.panels[1].id, DEFAULT_FIXED_FUNCTION_PANEL_ID)
        assert.equal(normalized.panels[1].title, 'Fixed Function Panel')
        assert.deepEqual(normalized.panels[1].itemIds, [
            ACTION_PANEL_ITEM_IDS.ZOOM_IN,
            ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
            ACTION_PANEL_ITEM_IDS.HOME,
            ACTION_PANEL_ITEM_IDS.CENTER_E3,
            ACTION_PANEL_ITEM_IDS.INITIATE,
            ACTION_PANEL_ITEM_IDS.RE_INITIATE,
        ])

        assert.equal(normalized.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID].width, 400)
        assert.equal(normalized.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID].height, null)
        assert.equal(normalized.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID].anchor.vertical.edge, 'top')
        assert.equal(normalized.layouts[DEFAULT_FIXED_FUNCTION_PANEL_ID].anchor.vertical.edge, 'bottom')
    })

    it('drops unknown items, legacy spacers, and preserves large widths', () => {
        const normalized = normalizeActionPanelsState({
            panels: [{
                id: 'custom-panel',
                title: 'Custom Panel',
                displayStyle: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
                itemIds: ['NOT_REAL', 'SPACER', ACTION_PANEL_ITEM_IDS.ZOOM_IN],
            }],
            layouts: {
                'custom-panel': {
                    anchor: {
                        horizontal: {edge: 'right', offset: 40},
                        vertical: {edge: 'bottom', offset: 50},
                    },
                    width: 999,
                    height: 240,
                },
            },
        })

        assert.equal(normalized.panels.length, 1)
        assert.deepEqual(normalized.panels[0].itemIds, [ACTION_PANEL_ITEM_IDS.ZOOM_IN])
        assert.equal(normalized.layouts['custom-panel'].width, 999)
        assert.equal(normalized.layouts['custom-panel'].height, 240)
        assert.equal(normalized.layouts['custom-panel'].anchor.horizontal.edge, 'right')
    })

    it('preserves an explicitly empty panels list', () => {
        const normalized = normalizeActionPanelsState({
            panels: [],
            layouts: {},
        })

        assert.deepEqual(normalized.panels, [])
        assert.deepEqual(normalized.layouts, {})
    })

    it('creates a new panel with a default layout', () => {
        const created = createEmptyActionPanel({title: 'Ops Panel'})

        assert.match(created.panel.id, /^action-panel-/)
        assert.equal(created.panel.title, 'Ops Panel')
        assert.deepEqual(created.panel.itemIds, [])
        assert.equal(created.layout.width, 400)
        assert.equal(created.layout.height, null)
        assert.equal(created.layout.anchor.horizontal.edge, 'left')
        assert.equal(created.layout.anchor.horizontal.offset, MAP_FLOATING_INSET_PX)
        assert.equal(created.layout.anchor.vertical.offset, MAP_FLOATING_INSET_PX)
    })
})

describe('createNewActionPanelLayout', () => {
    it('uses the base inset when no top-left panels exist', () => {
        const layout = createNewActionPanelLayout({
            'bottom-panel': {
                anchor: {
                    horizontal: {edge: 'left', offset: MAP_FLOATING_INSET_PX},
                    vertical: {edge: 'bottom', offset: MAP_FLOATING_INSET_PX},
                },
                width: 400,
                height: null,
            },
        })

        assert.equal(layout.anchor.horizontal.offset, MAP_FLOATING_INSET_PX)
        assert.equal(layout.anchor.vertical.offset, MAP_FLOATING_INSET_PX)
    })

    it('offsets new panels from existing top-left anchored panels', () => {
        const layout = createNewActionPanelLayout({
            'existing-panel': {
                anchor: {
                    horizontal: {edge: 'left', offset: MAP_FLOATING_INSET_PX},
                    vertical: {edge: 'top', offset: MAP_FLOATING_INSET_PX},
                },
                width: 400,
                height: null,
            },
        })

        assert.equal(layout.anchor.horizontal.offset, MAP_FLOATING_INSET_PX + ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX)
        assert.equal(layout.anchor.vertical.offset, MAP_FLOATING_INSET_PX + ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX)
    })

    it('staggers from the furthest top-left panel already on the map', () => {
        const layout = createNewActionPanelLayout({
            'first-panel': {
                anchor: {
                    horizontal: {edge: 'left', offset: MAP_FLOATING_INSET_PX},
                    vertical: {edge: 'top', offset: MAP_FLOATING_INSET_PX},
                },
                width: 400,
                height: null,
            },
            'second-panel': {
                anchor: {
                    horizontal: {edge: 'left', offset: MAP_FLOATING_INSET_PX + ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX},
                    vertical: {edge: 'top', offset: MAP_FLOATING_INSET_PX + ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX},
                },
                width: 400,
                height: null,
            },
        })

        assert.equal(layout.anchor.horizontal.offset, MAP_FLOATING_INSET_PX + (ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX * 2))
        assert.equal(layout.anchor.vertical.offset, MAP_FLOATING_INSET_PX + (ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX * 2))
    })
})

describe('actionPanelGridLayout', () => {
    it('uses one column on narrow panels and more columns as width grows', () => {
        assert.equal(getLargeGridColumnCount(180, 6), 1)
        assert.equal(getLargeGridColumnCount(400, 6), 3)
        assert.equal(getLargeGridColumnCount(900, 6), 6)
    })

    it('expands compact grid columns when horizontal space allows', () => {
        assert.equal(getCompactGridColumnCount(220, 4), 1)
        assert.equal(getCompactGridColumnCount(500, 4), 2)
        assert.equal(getCompactGridColumnCount(900, 4), 4)
    })

    it('keeps custom panels empty when no items are configured', () => {
        const normalized = normalizeActionPanelsState({
            panels: [{
                id: 'custom-empty-panel',
                title: 'Empty Panel',
                displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
                itemIds: [],
            }],
            layouts: {
                'custom-empty-panel': {
                    anchor: {
                        horizontal: {edge: 'left', offset: 20},
                        vertical: {edge: 'top', offset: 20},
                    },
                    width: 400,
                    height: null,
                },
            },
        })

        assert.deepEqual(normalized.panels[0].itemIds, [])
    })
})
