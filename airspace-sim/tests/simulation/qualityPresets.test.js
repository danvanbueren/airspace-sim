import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    DEFAULT_SIMULATION_SETTINGS,
    QUALITY_PRESET_CUSTOM,
    qualityPresetMatchesSettings,
    resolveQualityPresetAfterManualTuning,
} from '../../app/simulation/constants.js'

describe('quality presets', () => {
    it('defaults viewport-based track dropping to disabled', () => {
        assert.equal(DEFAULT_SIMULATION_SETTINGS.viewportBasedTrackDroppingEnabled, false)
    })

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

        assert.deepEqual(resolveQualityPresetAfterManualTuning(currentSettings, {
            maxActiveFlights: 1000,
        }), {
            qualityPreset: 'high',
            qualityPresetBeforeCustom: undefined,
        })
    })

    it('switches to custom when manual tuning diverges from the active preset', () => {
        const currentSettings = {
            qualityPreset: 'balanced',
            trackUpdateHz: 10,
            maxActiveFlights: 800,
        }

        assert.deepEqual(resolveQualityPresetAfterManualTuning(currentSettings, {
            maxActiveFlights: 850,
        }), {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            qualityPresetBeforeCustom: 'balanced',
        })
    })

    it('restores the prior preset when manual tuning matches it again', () => {
        const currentSettings = {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            qualityPresetBeforeCustom: 'balanced',
            trackUpdateHz: 10,
            maxActiveFlights: 850,
        }

        assert.deepEqual(resolveQualityPresetAfterManualTuning(currentSettings, {
            maxActiveFlights: 800,
        }), {
            qualityPreset: 'balanced',
            qualityPresetBeforeCustom: undefined,
        })
    })

    it('stays custom when manual tuning does not match the prior preset', () => {
        const currentSettings = {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            qualityPresetBeforeCustom: 'balanced',
            trackUpdateHz: 11,
            maxActiveFlights: 850,
        }

        assert.deepEqual(resolveQualityPresetAfterManualTuning(currentSettings, {
            trackUpdateHz: 12,
        }), {
            qualityPreset: QUALITY_PRESET_CUSTOM,
            qualityPresetBeforeCustom: 'balanced',
        })
    })
})
