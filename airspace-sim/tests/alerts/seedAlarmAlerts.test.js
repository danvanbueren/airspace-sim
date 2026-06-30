import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildSeedAlarmKey,
    SEED_ALARM_ALERTS,
} from '../../app/data/seedAlarmAlerts.js'
import {githubIssuesUrl} from '../../app/content/externalLinks.js'

test('seed alarm alerts define stable dedup keys', () => {
    const keys = SEED_ALARM_ALERTS.map((seedAlert) => buildSeedAlarmKey(seedAlert))
    const uniqueKeys = new Set(keys)

    assert.equal(keys.length, uniqueKeys.size)
})

test('development notice seed alert includes warning icon and GitHub issues link', () => {
    const developmentNotice = SEED_ALARM_ALERTS.find(
        (seedAlert) => seedAlert.seedKey === 'heavy-development',
    )

    assert.ok(developmentNotice)
    assert.equal(developmentNotice.messageIcon, '⚠️')
    assert.match(developmentNotice.message, /under heavy development/i)
    assert.match(developmentNotice.message, /report bugs/i)
    assert.equal(developmentNotice.linkUrl, githubIssuesUrl())
    assert.equal(developmentNotice.linkLabel, 'Report bugs on GitHub')
})
