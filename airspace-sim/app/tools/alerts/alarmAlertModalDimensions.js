/** Panel scroll area is 10rem tall by 20rem wide — used to link modal width to height. */
export const ALARM_ALERT_PANEL_WIDTH_REM = 20
export const ALARM_ALERT_PANEL_SCROLL_HEIGHT_REM = 10
export const ALARM_ALERT_MODAL_WIDTH_TO_HEIGHT_RATIO =
    ALARM_ALERT_PANEL_WIDTH_REM / ALARM_ALERT_PANEL_SCROLL_HEIGHT_REM

const VIEWPORT_MAX_FRACTION = 0.9

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
