import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from '../../app/actionPanels/actionPanelRegistry.js'
import {estimateActionPanelAutoHeight} from '../../app/actionPanels/actionPanelSizeEstimate.js'
import {
    ACTION_PANEL_TEMPLATE_CUSTOM,
    ACTION_PANEL_TEMPLATE_IDS,
    cloneActionPanelTemplateState,
    getActionPanelTemplate,
} from '../../app/actionPanels/actionPanelTemplates.js'
import {resolveActionPanelTemplateId} from '../../app/actionPanels/actionPanelTemplateSelection.js'
import {
    DEFAULT_CATEGORY_SELECT_PANEL_ID,
    DEFAULT_FIXED_FUNCTION_PANEL_ID,
} from '../../app/actionPanels/actionPanelDefaults.js'

describe('estimateActionPanelAutoHeight', () => {
    it('estimates large multi-row panels taller than the legacy minimum', () => {
        const estimatedHeight = estimateActionPanelAutoHeight({
            itemIds: [
                ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
                ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
                ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
                ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
                ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
                ACTION_PANEL_ITEM_IDS.AIRPORTS,
            ],
            displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
            panelWidthPx: 400,
        })

        assert.ok(estimatedHeight > 200)
    })
})

describe('actionPanelTemplates', () => {
    it('exposes the Basic template with both default panels', () => {
        const template = getActionPanelTemplate(ACTION_PANEL_TEMPLATE_IDS.BASIC)

        assert.ok(template)
        assert.equal(template.name, 'Basic')
        assert.equal(template.state.panels.length, 2)
        assert.equal(template.state.panels[0].id, DEFAULT_CATEGORY_SELECT_PANEL_ID)
        assert.equal(template.state.panels[1].id, DEFAULT_FIXED_FUNCTION_PANEL_ID)
    })

    it('clones template state without sharing references', () => {
        const clonedState = cloneActionPanelTemplateState(ACTION_PANEL_TEMPLATE_IDS.BASIC)

        assert.notEqual(clonedState, getActionPanelTemplate(ACTION_PANEL_TEMPLATE_IDS.BASIC).state)
        clonedState.panels[0].title = 'Changed title'
        assert.notEqual(
            clonedState.panels[0].title,
            getActionPanelTemplate(ACTION_PANEL_TEMPLATE_IDS.BASIC).state.panels[0].title,
        )
    })
})

describe('resolveActionPanelTemplateId', () => {
    it('returns Basic when state matches the default template', () => {
        const template = getActionPanelTemplate(ACTION_PANEL_TEMPLATE_IDS.BASIC)

        assert.equal(resolveActionPanelTemplateId(template.state), ACTION_PANEL_TEMPLATE_IDS.BASIC)
    })

    it('returns Custom when configuration diverges from every template', () => {
        const template = getActionPanelTemplate(ACTION_PANEL_TEMPLATE_IDS.BASIC)
        const customState = structuredClone(template.state)

        customState.panels[0].title = 'My Panel'

        assert.equal(resolveActionPanelTemplateId(customState), ACTION_PANEL_TEMPLATE_CUSTOM)
    })
})
