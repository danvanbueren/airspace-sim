import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'
import {
    getTrackIdentityChromeColors,
    getTrackIdentityMapStyle,
    getTrackMilStdIdentityColor,
} from '../../app/tools/milstd2525/trackIdentityColors.js'

describe('trackIdentityColors', () => {
    it('uses white pending chrome in dark mode', () => {
        const chrome = getTrackIdentityChromeColors(TRACK_IDENTITIES.PENDING, {
            palette: {mode: 'dark'},
        })

        assert.equal(chrome.focusOutline, '#f5f5f5')
    })

    it('derives map icon stroke colors from the chrome palette', () => {
        const pending = getTrackIdentityMapStyle(TRACK_IDENTITIES.PENDING, 'dark')
        const neutral = getTrackIdentityMapStyle(TRACK_IDENTITIES.NEUTRAL, 'dark')
        const friendly = getTrackIdentityMapStyle(TRACK_IDENTITIES.FRIENDLY, 'dark')

        assert.equal(pending.stroke, '#f5f5f5')
        assert.equal(neutral.stroke, '#61d36b')
        assert.equal(friendly.stroke, '#2ea7ff')
        assert.match(pending.fill, /^rgba\(/)
    })

    it('uses chrome colors for MIL-STD symbol identity overrides', () => {
        assert.equal(getTrackMilStdIdentityColor(TRACK_IDENTITIES.PENDING, 'dark'), '#f5f5f5')
        assert.equal(
            getTrackMilStdIdentityColor(TRACK_IDENTITIES.ASSUMED_FRIENDLY, 'dark'),
            '#61d36b',
        )
        assert.equal(getTrackMilStdIdentityColor(TRACK_IDENTITIES.SUSPECT, 'dark'), '#ff9a3d')
        assert.equal(getTrackMilStdIdentityColor(TRACK_IDENTITIES.HOSTILE, 'dark'), '#ff5252')
    })
})
