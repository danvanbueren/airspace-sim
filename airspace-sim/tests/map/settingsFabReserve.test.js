import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {createInitialActionPanelPosition} from '../../app/actionPanels/actionPanelViewportLayout.js'
import {ACTION_PANEL_ITEM_IDS} from '../../app/actionPanels/actionPanelRegistry.js'
import {
    DEFAULT_CATEGORY_SELECT_PANEL_ID,
    DEFAULT_FIXED_FUNCTION_PANEL_ID,
    DEFAULT_ACTION_PANELS_STATE,
} from '../../app/actionPanels/actionPanelDefaults.js'
import {MAP_GLASS_INSET_PX} from '../../app/constants/mapUiLayout.js'
import {
    clampPositionClearOfSettingsFab,
    panelRectOverlapsSettingsFab,
} from '../../app/tools/map/settingsFabReserve.js'

describe('createInitialActionPanelPosition', () => {
    it('places the category select panel at the top-left inset on first render', () => {
        const layout = DEFAULT_ACTION_PANELS_STATE.layouts[DEFAULT_CATEGORY_SELECT_PANEL_ID]
        const panel = DEFAULT_ACTION_PANELS_STATE.panels.find((entry) => entry.id === DEFAULT_CATEGORY_SELECT_PANEL_ID)

        const position = createInitialActionPanelPosition({
            storedAnchor: layout.anchor,
            storedWidth: layout.width,
            itemIds: panel.itemIds,
            displayStyle: panel.displayStyle,
            containerSize: {width: 1200, height: 800},
        })

        assert.equal(position.left, MAP_GLASS_INSET_PX)
        assert.equal(position.top, MAP_GLASS_INSET_PX)
    })

    it('anchors the fixed function panel to the bottom-left inset', () => {
        const layout = DEFAULT_ACTION_PANELS_STATE.layouts[DEFAULT_FIXED_FUNCTION_PANEL_ID]
        const panel = DEFAULT_ACTION_PANELS_STATE.panels.find((entry) => entry.id === DEFAULT_FIXED_FUNCTION_PANEL_ID)

        const position = createInitialActionPanelPosition({
            storedAnchor: layout.anchor,
            storedWidth: layout.width,
            itemIds: panel.itemIds,
            displayStyle: panel.displayStyle,
            containerSize: {width: 1200, height: 800},
        })

        assert.equal(position.left, MAP_GLASS_INSET_PX)
        assert.ok(position.top > MAP_GLASS_INSET_PX)
    })
})

describe('settingsFabReserve', () => {
    it('pushes panels left when they would cover the settings FAB', () => {
        const containerSize = {width: 1000, height: 800}
        const panelSize = {width: 400, height: 200}
        const bounds = {
            minLeft: 8,
            minTop: 8,
            maxLeft: 572,
            maxTop: 572,
        }

        const nextPosition = clampPositionClearOfSettingsFab(
            {left: 700, top: 20},
            panelSize,
            containerSize,
            bounds,
        )

        assert.equal(panelRectOverlapsSettingsFab(
            nextPosition.left,
            nextPosition.top,
            panelSize,
            containerSize,
        ), false)
    })
})
