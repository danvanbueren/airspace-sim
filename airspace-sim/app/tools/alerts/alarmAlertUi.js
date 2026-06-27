import {getSignalLabel, isIffEmergencyAlertSignalId, MISC_SIGNAL_ID} from '@/app/simulation/signalDefinitions'

/**
 * @param {{ signalId?: string }} alert
 * @returns {boolean}
 */
export function alertHasTrackFocus(alert) {
    return isIffEmergencyAlertSignalId(alert?.signalId)
}

/**
 * @param {{ linkUrl?: string|null }} alert
 * @returns {boolean}
 */
export function alertHasLink(alert) {
    return typeof alert?.linkUrl === 'string' && alert.linkUrl.length > 0
}

/**
 * @param {{ linkUrl?: string|null, linkLabel?: string|null }} alert
 */
export function openAlertLink(alert) {
    if (!alertHasLink(alert)) {
        return
    }

    window.open(alert.linkUrl, '_blank', 'noopener,noreferrer')
}

/**
 * @param {{ linkUrl?: string|null, linkLabel?: string|null }} alert
 * @returns {string}
 */
export function getAlertLinkAriaLabel(alert) {
    if (typeof alert?.linkLabel === 'string' && alert.linkLabel.length > 0) {
        return alert.linkLabel
    }

    return 'Open related link'
}

/**
 * @param {{ signalId?: string }} alert
 * @returns {string}
 */
export function getAlertInhibitAriaLabel(alert) {
    const signalId = alert?.signalId ?? MISC_SIGNAL_ID
    return `Inhibit ${getSignalLabel(signalId)} alerts`
}

/**
 * Scroll an alert row to the vertical center of its scroll container.
 *
 * Uses manual scrollTop math instead of scrollIntoView so nested modal
 * scroll regions are not driven toward the viewport bottom.
 *
 * @param {HTMLElement|null|undefined} scrollContainer
 * @param {HTMLElement|null|undefined} alertElement
 */
export function scrollAlertIntoCenter(scrollContainer, alertElement) {
    if (!scrollContainer || !alertElement) {
        return
    }

    const containerRect = scrollContainer.getBoundingClientRect()
    const alertRect = alertElement.getBoundingClientRect()
    const relativeTop = alertRect.top - containerRect.top + scrollContainer.scrollTop
    const targetScrollTop = relativeTop - ((containerRect.height - alertRect.height) / 2)
    const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight

    scrollContainer.scrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))
}
