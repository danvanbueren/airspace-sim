import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'
import {
    getTrackIdentityChromeColors,
    getTrackIdentityMapStyle,
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
})
