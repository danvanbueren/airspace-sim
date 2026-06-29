/**
 * Seed alarm alerts raised once after the page loads.
 * Add entries here to surface operator notices on startup.
 */

import {EXTERNAL_LINKS, githubBlobUrl} from '../content/externalLinks.js'

/** @typedef {Object} SeedAlarmAlertDefinition
 * @property {string} seedKey Stable key used for deduplication within a page session
 * @property {string} signalId Alert signal ID from signalDefinitions.js
 * @property {string} [messageIcon] Optional emoji or character shown left of the message
 * @property {string} message Alert body text
 * @property {string} [linkUrl] Optional external link opened by the alert link action
 * @property {string} [linkLabel] Accessible label for the link action button
 */

/** @type {SeedAlarmAlertDefinition[]} */
export const SEED_ALARM_ALERTS = [
    {
        seedKey: 'bearing-range-rewrite',
        signalId: 'SYSTEM_NOTICE',
        messageIcon: '⚠️',
        message: 'The bearing range line system is currently buggy and undergoing active fixes.',
        linkUrl: githubBlobUrl(EXTERNAL_LINKS.docs.bearingRangeRewritePlan),
        linkLabel: 'View bearing range rewrite plan',
    },
]

/**
 * @param {SeedAlarmAlertDefinition} seedAlert
 * @returns {string}
 */
export function buildSeedAlarmKey(seedAlert) {
    return `seed:${seedAlert.seedKey}`
}
