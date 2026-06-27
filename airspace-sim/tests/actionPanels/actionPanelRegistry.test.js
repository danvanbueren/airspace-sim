import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getActionPanelItemDefinition,
    getAvailableAssignableItems,
} from '../../app/actionPanels/actionPanelRegistry.js'
import {ACTION_PANEL_ITEM_IDS} from '../../app/actionPanels/actionPanelRegistry.js'

describe('getActionPanelItemDefinition', () => {
    it('formats RE-INITIATE with a dash', () => {
        assert.equal(
            getActionPanelItemDefinition(ACTION_PANEL_ITEM_IDS.RE_INITIATE)?.label,
            'RE-INITIATE',
        )
    })
})

describe('getAvailableAssignableItems', () => {
    it('excludes items already assigned to the panel', () => {
        const available = getAvailableAssignableItems([
            ACTION_PANEL_ITEM_IDS.ZOOM_IN,
            ACTION_PANEL_ITEM_IDS.HOME,
        ])

        assert.equal(available.some((item) => item.id === ACTION_PANEL_ITEM_IDS.ZOOM_IN), false)
        assert.equal(available.some((item) => item.id === ACTION_PANEL_ITEM_IDS.HOME), false)
        assert.equal(available.some((item) => item.id === ACTION_PANEL_ITEM_IDS.INITIATE), true)
    })
})
