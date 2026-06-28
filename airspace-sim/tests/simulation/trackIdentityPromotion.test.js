import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {
    IFF_IDENTITY_PROMOTION_DELAY_MS,
    PENDING_IDENTITY_TIMEOUT_MS,
    getTrackIdentityPromotionUpdates,
    processTrackIdentityPromotion,
} from '../../app/simulation/trackIdentityPromotion.js'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
} from '../../app/tools/milstd2525/trackSymbolCodes.js'
import {MODE3_CODE_VFR_US} from '../../app/simulation/iffMode3.js'

function pendingTrack(overrides = {}) {
    return {
        id: 'TRK-1',
        trackId: 'TRK-1',
        longitude: -75,
        latitude: 40,
        heading: 90,
        speed: 400,
        altitude: 30_000,
        lastSensorUpdateAt: 0,
        lastExtrapolationAt: 0,
        stale: false,
        domain: TRACK_DOMAINS.AIR,
        identity: TRACK_IDENTITIES.PENDING,
        type: TRACK_TYPES.AIR_UNSPECIFIED,
        specificType: '',
        callsign: 'CIV01',
        source: 'auto',
        identityPendingSinceAt: 0,
        ...overrides,
    }
}

describe('trackIdentityPromotion', () => {
    it('keeps pending tracks pending for 5 seconds after valid IFF is registered', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 1000,
            }),
            4000,
        )

        assert.equal(updates, null)
    })

    it('promotes pending air tracks to neutral civilian after 5 seconds of valid IFF', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 1000,
            }),
            1000 + IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(updates.type, TRACK_TYPES.CIVILIAN_AIR)
        assert.equal(updates.specificType, '')
    })

    it('promotes pending tracks with shared VFR squawks after the IFF delay', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                iffMode3Code: MODE3_CODE_VFR_US,
                iffMode3UpdatedAt: 0,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(updates.type, TRACK_TYPES.CIVILIAN_AIR)
    })

    it('does not promote to unknown while waiting for the IFF promotion delay', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                identityPendingSinceAt: 0,
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 8000,
            }),
            PENDING_IDENTITY_TIMEOUT_MS,
        )

        assert.equal(updates, null)
    })

    it('promotes pending tracks without IFF to unknown after 10 seconds', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                identityPendingSinceAt: 0,
            }),
            PENDING_IDENTITY_TIMEOUT_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.UNKNOWN)
        assert.equal(updates.type, undefined)
    })

    it('does not override user-committed identity edits', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['identity'],
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 0,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, undefined)
        assert.equal(updates.type, TRACK_TYPES.CIVILIAN_AIR)
        assert.equal(updates.specificType, '')
    })

    it('does not override user-committed type or specific type on IFF promotion', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['type'],
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 0,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(updates.type, undefined)
        assert.equal(updates.specificType, undefined)
    })

    it('does not override user-committed identity on pending timeout', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['identity'],
                identityPendingSinceAt: 0,
            }),
            PENDING_IDENTITY_TIMEOUT_MS,
        )

        assert.equal(updates, null)
    })

    it('does not override user-committed domain, type, or specific type fields', () => {
        const domainProtected = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['domain'],
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 0,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(domainProtected.domain, undefined)

        const specificTypeProtected = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['specificType'],
                iffMode3Code: '4231',
                iffMode3UpdatedAt: 0,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(specificTypeProtected.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(specificTypeProtected.type, undefined)
        assert.equal(specificTypeProtected.specificType, undefined)
    })

    it('processes identity promotion updates through the track store', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(pendingTrack())

        processTrackIdentityPromotion(trackStore, PENDING_IDENTITY_TIMEOUT_MS)

        const track = trackStore.getTrack('TRK-1')
        assert.equal(track.identity, TRACK_IDENTITIES.UNKNOWN)
        assert.equal(track.type, TRACK_TYPES.AIR_UNSPECIFIED)
    })
})
