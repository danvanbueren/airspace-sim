import {isIffEmergencyAlertSignalId} from '@/app/simulation/signalDefinitions'

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
