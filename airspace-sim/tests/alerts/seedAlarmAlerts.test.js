import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildSeedAlarmKey,
    SEED_ALARM_ALERTS,
} from '../../app/content/seedAlarmAlerts.js'

test('seed alarm alerts define stable dedup keys', () => {
    const keys = SEED_ALARM_ALERTS.map((seedAlert) => buildSeedAlarmKey(seedAlert))
    const uniqueKeys = new Set(keys)

    assert.equal(keys.length, uniqueKeys.size)
})

test('bearing range seed alert includes warning icon and rewrite plan link', () => {
    const bearingRangeAlert = SEED_ALARM_ALERTS.find(
        (seedAlert) => seedAlert.seedKey === 'bearing-range-rewrite',
    )

    assert.ok(bearingRangeAlert)
    assert.equal(bearingRangeAlert.messageIcon, '⚠️')
    assert.match(bearingRangeAlert.message, /bearing range line system/i)
    assert.equal(
        bearingRangeAlert.linkUrl,
        'https://github.com/danvanbueren/airspace-sim/blob/main/docs/bearing-range-tool-rewrite-plan.md',
    )
    assert.equal(bearingRangeAlert.linkLabel, 'View bearing range rewrite plan')
})
