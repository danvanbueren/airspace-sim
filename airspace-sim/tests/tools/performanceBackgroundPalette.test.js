import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    PERFORMANCE_BACKGROUND_BLOB_COUNT,
    computePerformanceHeat,
    easeInOutCubic,
    getBlobDrift,
    getPaletteForHeat,
    getPerformanceBackgroundCssVariables,
    smoothToward,
} from '../../app/tools/performance/performanceBackgroundPalette.js'

describe('performanceBackgroundPalette', () => {
    it('maps frame budgets to the expected heat bands', () => {
        assert.equal(computePerformanceHeat(12), 0)
        assert.equal(computePerformanceHeat(16.67), 0)

        const warningHeat = computePerformanceHeat(18.5)
        assert.ok(warningHeat > 0)
        assert.ok(warningHeat < 0.55)

        const poorHeat = computePerformanceHeat(25)
        assert.ok(poorHeat > 0.55)
        assert.ok(poorHeat < 1)

        assert.equal(computePerformanceHeat(40), 1)
        assert.equal(computePerformanceHeat(80), 1)
    })

    it('eases heat transitions with a small peak blend', () => {
        const averageOnly = computePerformanceHeat(18, 30, {peakBlend: 0})
        const blended = computePerformanceHeat(18, 30)

        assert.ok(blended > averageOnly)
    })

    it('eases in and out instead of using a linear ramp', () => {
        assert.equal(easeInOutCubic(0), 0)
        assert.equal(easeInOutCubic(1), 1)
        assert.ok(easeInOutCubic(0.5) > 0.4)
        assert.ok(easeInOutCubic(0.5) < 0.6)
    })

    it('smoothly approaches a target over time', () => {
        const firstStep = smoothToward(0, 1, 0.5, 4)
        const secondStep = smoothToward(firstStep, 1, 0.5, 4)

        assert.ok(firstStep > 0)
        assert.ok(firstStep < 1)
        assert.ok(secondStep > firstStep)
        assert.ok(Math.abs(smoothToward(0.999, 1, 2, 4) - 1) < 0.01)
    })

    it('returns warmer palettes as heat increases', () => {
        const coolPalette = getPaletteForHeat(0)
        const hotPalette = getPaletteForHeat(1)

        assert.equal(coolPalette.length, PERFORMANCE_BACKGROUND_BLOB_COUNT)
        assert.equal(hotPalette.length, PERFORMANCE_BACKGROUND_BLOB_COUNT)
        assert.notDeepEqual(coolPalette, hotPalette)
        assert.match(hotPalette[0], /^rgb\(/)
    })

    it('drifts blobs slowly unless reduced motion is requested', () => {
        const moving = getBlobDrift(12, 0, false)
        const staticDrift = getBlobDrift(12, 0, true)

        assert.notEqual(moving.x, 0)
        assert.notEqual(moving.y, 0)
        assert.deepEqual(staticDrift, {x: 0, y: 0})
    })

    it('builds css variables for each animated blob', () => {
        const variables = getPerformanceBackgroundCssVariables(0.25, 5)

        assert.equal(variables['--perf-heat'], '0.25')
        assert.match(variables['--perf-blob-0-color'], /^rgb\(/)
        assert.match(variables['--perf-blob-0-x'], /px$/)
        assert.match(variables['--perf-blob-3-y'], /px$/)
    })
})
