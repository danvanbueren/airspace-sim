import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    QUALITY_PRESET_CUSTOM,
    qualityPresetMatchesSettings,
    resolveQualityPresetAfterManualTuning,
} from '../../app/simulation/constants.js'

describe('quality presets', () => {
    it('matches preset tuning values exactly', () => {
        assert.equal(qualityPresetMatchesSettings('balanced', {
            trackUpdateHz: 10,
            maxActiveFlights: 800,
        }), true)
        assert.equal(qualityPresetMatchesSettings('balanced', {
            trackUpdateHz: 12,
            maxActiveFlights: 800,
        }), false)
    })

    it('keeps the active preset when manual tuning still matches it', () => {
        const currentSettings = {
            qualityPreset: 'high',
            trackUpdateHz: 12,
            maxActiveFlights: 1000,
        }

        assert.equal(resolveQualityPresetAfterManualTuning(currentSettings, {
            maxActiveFlights: 1000,
        }), 'high')
    })

    it('switches to custom when manual tuning diverges from the active preset', () => {
        const currentSettings = {
            qualityPreset: 'balanced',
            trackUpdateHz: 10,
            maxActiveFlights: 800,
        }

        assert.equal(resolveQualityPresetAfterManualTuning(currentSettings, {
            maxActiveFlights: 850,
        }), QUALITY_PRESET_CUSTOM)
    })

    it('stays custom after further manual tuning', () => {
        const currentSettings = {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            trackUpdateHz: 11,
            maxActiveFlights: 850,
        }

        assert.equal(resolveQualityPresetAfterManualTuning(currentSettings, {
            trackUpdateHz: 12,
        }), QUALITY_PRESET_CUSTOM)
    })
})
