import {normalizeActionPanelsState} from './normalizeActionPanels.js'
import {
    ACTION_PANEL_TEMPLATE_CUSTOM,
    ACTION_PANEL_TEMPLATES,
} from './actionPanelTemplates.js'

function serializeActionPanelsForTemplateMatch(state) {
    const normalized = normalizeActionPanelsState(state)

    return JSON.stringify({
        panels: normalized.panels.map((panel) => ({
            id: panel.id,
            title: panel.title,
            displayStyle: panel.displayStyle,
            itemIds: panel.itemIds,
        })),
        layouts: normalized.layouts,
    })
}

export function actionPanelStatesMatchTemplate(state, templateState) {
    return serializeActionPanelsForTemplateMatch(state)
        === serializeActionPanelsForTemplateMatch(templateState)
}

export function resolveActionPanelTemplateId(state) {
    const matchingTemplate = ACTION_PANEL_TEMPLATES.find((template) => (
        actionPanelStatesMatchTemplate(state, template.state)
    ))

    return matchingTemplate?.id ?? ACTION_PANEL_TEMPLATE_CUSTOM
}

export function getActionPanelTemplateLabel(templateId) {
    if (templateId === ACTION_PANEL_TEMPLATE_CUSTOM) {
        return 'Custom'
    }

    return ACTION_PANEL_TEMPLATES.find((template) => template.id === templateId)?.name ?? templateId
}
