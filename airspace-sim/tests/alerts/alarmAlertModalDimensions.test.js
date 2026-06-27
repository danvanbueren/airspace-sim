import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateAlarmAlertModalDimensions} from '../../app/tools/alerts/alarmAlertModalDimensions.js'

test('calculateAlarmAlertModalDimensions links width to height using panel ratio', () => {
    const dimensions = calculateAlarmAlertModalDimensions({
        contentScrollHeight: 200,
        chromeHeight: 80,
        viewportHeight: 1000,
        viewportWidth: 1000,
        rootFontSizePx: 16,
    })

    assert.equal(dimensions.height, 280)
    assert.equal(dimensions.width, 560)
})

test('calculateAlarmAlertModalDimensions caps height and width at 90% of viewport', () => {
    const dimensions = calculateAlarmAlertModalDimensions({
        contentScrollHeight: 2000,
        chromeHeight: 80,
        viewportHeight: 800,
        viewportWidth: 600,
        rootFontSizePx: 16,
    })

    assert.equal(dimensions.height, 720)
    assert.equal(dimensions.width, 540)
})

test('calculateAlarmAlertModalDimensions enforces panel minimum height', () => {
    const dimensions = calculateAlarmAlertModalDimensions({
        contentScrollHeight: 40,
        chromeHeight: 20,
        viewportHeight: 1000,
        viewportWidth: 1000,
        rootFontSizePx: 16,
    })

    assert.equal(dimensions.height, 160)
    assert.equal(dimensions.width, 320)
})
