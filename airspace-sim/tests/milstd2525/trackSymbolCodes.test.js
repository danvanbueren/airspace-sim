import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    REFERENCE_POINT_SYMBOL_CODE,
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
    applyIdentityToSymbolCode,
    getTrackSymbolCode,
    getTrackTypeOption,
    normalizeTrackDomain,
    resolveTrackSymbolCode,
    resolveTrackTypeForDomain,
} from '../../app/tools/milstd2525/trackSymbolCodes.js'

describe('trackSymbolCodes', () => {
    it('normalizes legacy uppercase domain values', () => {
        assert.equal(normalizeTrackDomain('AIR'), TRACK_DOMAINS.AIR)
        assert.equal(normalizeTrackDomain('surface'), TRACK_DOMAINS.SURFACE)
    })

    it('returns null when a track type is not valid for the selected domain', () => {
        assert.equal(getTrackTypeOption(TRACK_TYPES.FIGHTER, TRACK_DOMAINS.SURFACE), null)
        assert.equal(getTrackTypeOption(TRACK_TYPES.SURFACE_COMBATANT, TRACK_DOMAINS.AIR), null)
    })

    it('returns the option when a track type is valid for the selected domain', () => {
        assert.equal(
            getTrackTypeOption(TRACK_TYPES.FIGHTER, TRACK_DOMAINS.AIR)?.value,
            TRACK_TYPES.FIGHTER,
        )
        assert.equal(
            getTrackTypeOption(TRACK_TYPES.SURFACE_COMBATANT, TRACK_DOMAINS.SURFACE)?.value,
            TRACK_TYPES.SURFACE_COMBATANT,
        )
    })

    it('resolves invalid cross-domain track types to the domain unspecified type', () => {
        assert.equal(
            resolveTrackTypeForDomain(TRACK_TYPES.FIGHTER, TRACK_DOMAINS.SURFACE),
            '30:000000',
        )
        assert.equal(
            resolveTrackTypeForDomain(TRACK_TYPES.SURFACE_COMBATANT, TRACK_DOMAINS.AIR),
            TRACK_TYPES.AIR_UNSPECIFIED,
        )
    })

    it('applies identity to full SIDC symbol codes', () => {
        assert.equal(
            applyIdentityToSymbolCode(REFERENCE_POINT_SYMBOL_CODE, TRACK_IDENTITIES.PENDING),
            '10002500002136000000',
        )
        assert.equal(
            applyIdentityToSymbolCode(REFERENCE_POINT_SYMBOL_CODE, TRACK_IDENTITIES.HOSTILE),
            '10062500002136000000',
        )
    })

    it('resolves reference point symbol codes from stored track identity', () => {
        assert.equal(
            resolveTrackSymbolCode({
                symbolCode: REFERENCE_POINT_SYMBOL_CODE,
                type: REFERENCE_POINT_SYMBOL_CODE,
                identity: TRACK_IDENTITIES.PENDING,
            }),
            '10002500002136000000',
        )
    })

    it('builds fighter symbol codes with the selected identity', () => {
        assert.equal(
            getTrackSymbolCode({
                domain: TRACK_DOMAINS.AIR,
                identity: TRACK_IDENTITIES.FRIENDLY,
                type: TRACK_TYPES.FIGHTER,
            }),
            '10030100001101040000',
        )
    })
})
