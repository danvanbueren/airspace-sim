import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {
    IFF_IDENTITY_PROMOTION_DELAY_MS,
    PENDING_IDENTITY_TIMEOUT_MS,
    getIdentityPromotionTypeForTrack,
    getTrackIdentityPromotionUpdates,
    processTrackIdentityPromotion,
} from '../../app/simulation/trackIdentityPromotion.js'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
} from '../../app/tools/milstd2525/trackSymbolCodes.js'
import {TRACK_KINDS} from '../../app/simulation/trackKinds.js'
import {MODE3_CODE_VFR_US} from '../../app/simulation/iffMode3.js'
import {applyIffCorrelationFields} from '../../app/simulation/iffCorrelation.js'

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
                iffMode3FirstCorrelatedAt: 1000,
                iffMode3UpdatedAt: 4000,
            }),
            4000,
        )

        assert.equal(updates, null)
    })

    it('promotes pending air tracks after 5 seconds even when IFF refresh keeps updating', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                iffMode3Code: '4231',
                iffMode3FirstCorrelatedAt: 1000,
                iffMode3UpdatedAt: 9000,
            }),
            1000 + IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(updates.type, TRACK_TYPES.CIVILIAN_AIR)
    })

    it('assigns the general aviation type for GA traffic profiles', () => {
        assert.equal(
            getIdentityPromotionTypeForTrack(pendingTrack({
                trafficKind: 'generalAviation',
            })),
            TRACK_TYPES.GENERAL_AVIATION,
        )

        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                trafficKind: 'generalAviation',
                profile: 'generalAviation',
                iffMode3Code: MODE3_CODE_VFR_US,
                iffMode3FirstCorrelatedAt: 0,
                iffMode3UpdatedAt: 4000,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.type, TRACK_TYPES.GENERAL_AVIATION)
    })

    it('promotes pending tracks with shared VFR squawks after the IFF delay', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                iffMode3Code: MODE3_CODE_VFR_US,
                iffMode3FirstCorrelatedAt: 0,
                iffMode3UpdatedAt: 4000,
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
                iffMode3FirstCorrelatedAt: 8000,
                iffMode3UpdatedAt: 9900,
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
                iffMode3FirstCorrelatedAt: 0,
                iffMode3UpdatedAt: 4000,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, undefined)
        assert.equal(updates.type, TRACK_TYPES.CIVILIAN_AIR)
    })

    it('does not override user-committed type or specific type on IFF promotion', () => {
        const updates = getTrackIdentityPromotionUpdates(
            pendingTrack({
                lastManagementEditFields: ['type'],
                iffMode3Code: '4231',
                iffMode3FirstCorrelatedAt: 0,
                iffMode3UpdatedAt: 4000,
            }),
            IFF_IDENTITY_PROMOTION_DELAY_MS,
        )

        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(updates.type, undefined)
    })

    it('preserves the first IFF correlation timestamp across refresh updates', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(pendingTrack())

        applyIffCorrelationFields(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-1',
            mode3Code: '4231',
        }], 1000)

        applyIffCorrelationFields(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-1',
            mode3Code: '4231',
        }], 4000)

        const track = trackStore.getTrack('TRK-1')
        assert.equal(track.iffMode3FirstCorrelatedAt, 1000)
        assert.equal(track.iffMode3UpdatedAt, 4000)

        const updates = getTrackIdentityPromotionUpdates(track, 6000)
        assert.equal(updates.identity, TRACK_IDENTITIES.NEUTRAL)
    })

    it('processes identity promotion updates through the track store', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(pendingTrack())

        processTrackIdentityPromotion(trackStore, PENDING_IDENTITY_TIMEOUT_MS)

        const track = trackStore.getTrack('TRK-1')
        assert.equal(track.identity, TRACK_IDENTITIES.UNKNOWN)
        assert.equal(track.type, TRACK_TYPES.AIR_UNSPECIFIED)
    })

    it('does not auto-promote reference point identities', () => {
        const updates = getTrackIdentityPromotionUpdates({
            trackKind: TRACK_KINDS.REFERENCE_POINT,
            trackId: 'RP-1',
            identity: TRACK_IDENTITIES.PENDING,
            identityPendingSinceAt: 0,
            domain: TRACK_DOMAINS.ACTIVITY,
            dropProtect: true,
        }, PENDING_IDENTITY_TIMEOUT_MS)

        assert.equal(updates, null)
    })
})
