/** Panel scroll area is 10rem tall by 20rem wide — used to link modal width to height. */
export const ALARM_ALERT_PANEL_WIDTH_REM = 20
export const ALARM_ALERT_PANEL_SCROLL_HEIGHT_REM = 10
export const ALARM_ALERT_MODAL_WIDTH_TO_HEIGHT_RATIO =
    ALARM_ALERT_PANEL_WIDTH_REM / ALARM_ALERT_PANEL_SCROLL_HEIGHT_REM

const VIEWPORT_MAX_FRACTION = 0.9
const MODAL_PADDING_PX = 24
const CLEAR_ALL_BUTTON_HEIGHT_PX = 36
const END_OF_ALERTS_HEIGHT_PX = 28

/**
 * @param {boolean} showClearAll
 * @returns {number}
 */
export function getAlarmAlertModalChromeHeight(showClearAll) {
    return (
        MODAL_PADDING_PX * 2
        + (showClearAll ? CLEAR_ALL_BUTTON_HEIGHT_PX + 8 : 0)
        + END_OF_ALERTS_HEIGHT_PX
    )
}

/**
 * Estimate scrollable alert-list height from alert data (no DOM measurement).
 *
 * @param {Array<{ message?: string, messageIcon?: string|null }>} alerts
 * @returns {number}
 */
export function estimateAlarmAlertContentHeight(alerts) {
    const STACK_PADDING = 16
    const ALERT_PADDING_TOP = 8
    const SIGNAL_LABEL = 22
    const TIMESTAMP = 36
    const DIVIDER = 16
    const LINE_HEIGHT = 21
    const CHARS_PER_LINE = 45
    const MESSAGE_ICON_EXTRA = 8

    let total = STACK_PADDING + END_OF_ALERTS_HEIGHT_PX

    for (let index = 0; index < alerts.length; index += 1) {
        if (index > 0) {
            total += DIVIDER
        }

        const alert = alerts[index]
        const message = typeof alert.message === 'string' ? alert.message : ''
        const iconExtra = alert.messageIcon ? MESSAGE_ICON_EXTRA : 0
        const lines = Math.max(1, Math.ceil(message.length / CHARS_PER_LINE))

        total += ALERT_PADDING_TOP
            + SIGNAL_LABEL
            + (lines * LINE_HEIGHT)
            + TIMESTAMP
            + iconExtra
            + 8
    }

    return total
}

/**
 * @param {number} rootFontSizePx
 * @returns {number}
 */
function remToPx(rem, rootFontSizePx) {
    return rem * rootFontSizePx
}

/**
 * Lock modal width/height from measured content once when the modal opens.
 *
 * @param {{
 *   contentScrollHeight: number,
 *   chromeHeight: number,
 *   viewportHeight: number,
 *   viewportWidth: number,
 *   rootFontSizePx: number,
 * }} input
 * @returns {{ width: number, height: number }}
 */
export function calculateAlarmAlertModalDimensions({
    contentScrollHeight,
    chromeHeight,
    viewportHeight,
    viewportWidth,
    rootFontSizePx,
}) {
    const viewportMaxHeight = viewportHeight * VIEWPORT_MAX_FRACTION
    const viewportMaxWidth = viewportWidth * VIEWPORT_MAX_FRACTION
    const panelWidthPx = remToPx(ALARM_ALERT_PANEL_WIDTH_REM, rootFontSizePx)
    const minHeightPx = remToPx(ALARM_ALERT_PANEL_SCROLL_HEIGHT_REM, rootFontSizePx)

    const naturalHeight = contentScrollHeight + chromeHeight
    const height = Math.min(
        Math.max(naturalHeight, minHeightPx),
        viewportMaxHeight,
    )
    const width = Math.min(
        Math.max(height * ALARM_ALERT_MODAL_WIDTH_TO_HEIGHT_RATIO, panelWidthPx),
        viewportMaxWidth,
    )

    return {width, height}
}
