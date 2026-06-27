import {DEFAULT_ACTION_PANELS_STATE} from './actionPanelDefaults.js'

export const ACTION_PANEL_TEMPLATE_IDS = {
    BASIC: 'basic',
}

export const ACTION_PANEL_TEMPLATE_CUSTOM = 'custom'

/**
 * Developer-maintained action panel profiles. Add entries here to expose new
 * layouts in Settings → Action Panels → Templates.
 */
export const ACTION_PANEL_TEMPLATES = [
    {
        id: ACTION_PANEL_TEMPLATE_IDS.BASIC,
        name: 'Basic',
        description: 'Category Select at top-left and Fixed Function at bottom-left with standard map and display controls.',
        state: DEFAULT_ACTION_PANELS_STATE,
    },
]

export function getActionPanelTemplate(templateId) {
    return ACTION_PANEL_TEMPLATES.find((template) => template.id === templateId) ?? null
}

export function cloneActionPanelTemplateState(templateId) {
    const template = getActionPanelTemplate(templateId)

    if (!template) {
        return null
    }

    return structuredClone(template.state)
}
