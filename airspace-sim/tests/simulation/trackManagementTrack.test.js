import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    createTrackFromManagementWindow,
    createTrackUpdateFromManagementWindow,
    expandSkipFieldsWithCommittedManagementEdits,
    expandTrackManagementWindowSkipLiveFields,
    getTrackManagementWindowLiveUpdatesFromTrack,
    mergeLiveTracksForManagementWindowSync,
    mergeUserDirectedLayerTrackOverSimulation,
    syncTrackManagementWindowsFromTracks,
} from '../../app/tools/map/trackManagementTrack.js'

function managementWindow(overrides = {}) {
    return {
        trackId: 'AUTO-1',
        lngLat: {
            lng: -75,
            lat: 40,
        },
        domain: 'air',
        identity: 'NEUTRAL',
        type: '01:110104',
        specificType: 'F-16C',
        heading: 45,
        speed: 420,
        altitude: 12_000,
        infoFields: false,
        callsign: 'CIV01',
        correlationMode: 'active',
        source: 'auto',
        ...overrides,
    }
}

function existingTrack(overrides = {}) {
    return {
        id: 'AUTO-1',
        trackId: 'AUTO-1',
        longitude: -76,
        latitude: 41,
        domain: 'air',
        identity: 'NEUTRAL',
        type: '01:110104',
        specificType: 'F-16C',
        heading: 120,
        speed: 470,
        altitude: 13_000,
        infoFields: false,
        callsign: 'CIV01',
        correlationMode: 'active',
        source: 'auto',
        correlated: true,
        lastSensorUpdateAt: 10_000,
        ...overrides,
    }
}

describe('track management track updates', () => {
    it('creates manual tracks from management window kinematics', () => {
        assert.deepEqual(createTrackFromManagementWindow(managementWindow({
            trackId: 'MAN-1',
            heading: 370,
            speed: '',
            altitude: '35,000',
            callsign: '',
            source: 'manual',
        })), {
            id: 'MAN-1',
            trackId: 'MAN-1',
            longitude: -75,
            latitude: 40,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            heading: 10,
            speed: null,
            altitude: 35_000,
            infoFields: false,
            callsign: 'MAN-1',
            correlationMode: 'active',
            source: 'manual',
        })
    })

    it('preserves live kinematics when only metadata changes', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                callsign: 'VIP01',
                heading: 45,
                speed: 420,
                altitude: 12_000,
            }),
            existingTrack({
                heading: 120,
                speed: 470,
                altitude: 13_000,
            }),
            ['callsign'],
        )

        assert.equal(updated.callsign, 'VIP01')
        assert.equal(updated.longitude, -76)
        assert.equal(updated.latitude, 41)
        assert.equal(updated.heading, 120)
        assert.equal(updated.speed, 470)
        assert.equal(updated.altitude, 13_000)
        assert.equal(updated.source, 'manual')
        assert.equal(updated.userDirected, true)
    })

    it('updates only the committed kinematic fields', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: '090',
                speed: 420,
                altitude: 12_000,
            }),
            existingTrack({
                heading: 120,
                speed: 470,
                altitude: 13_000,
            }),
            ['heading'],
        )

        assert.equal(updated.heading, 90)
        assert.equal(updated.speed, 470)
        assert.equal(updated.altitude, 13_000)
        assert.deepEqual(updated.lastManagementEditFields, ['heading'])
        assert.ok(updated.lastUserKinematicEditAt > 0)
        assert.deepEqual(updated.lastUserKinematicEditFields, ['heading'])
    })

    it('accumulates committed fields across successive edits', () => {
        const afterHeadingEdit = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: '090',
            }),
            existingTrack({
                heading: 120,
            }),
            ['heading'],
        )

        const afterCallsignEdit = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: 90,
                callsign: 'VIP01',
            }),
            afterHeadingEdit,
            ['callsign'],
        )

        assert.deepEqual(
            afterCallsignEdit.lastManagementEditFields.sort(),
            ['callsign', 'heading'],
        )
        assert.equal(afterCallsignEdit.heading, 90)
        assert.equal(afterCallsignEdit.callsign, 'VIP01')
    })

    it('preserves prior kinematic commits when metadata edits merge from fresh engine track', () => {
        const staleSnapshotTrack = existingTrack({
            heading: 120,
            callsign: 'CIV01',
        })

        const freshEngineTrack = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: '090',
            }),
            staleSnapshotTrack,
            ['heading'],
        )

        const mergedFromStaleSnapshot = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: 90,
                callsign: 'VIP01',
            }),
            staleSnapshotTrack,
            ['callsign'],
        )

        const mergedFromFreshEngine = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: 90,
                callsign: 'VIP01',
            }),
            freshEngineTrack,
            ['callsign'],
        )

        assert.equal(mergedFromStaleSnapshot.heading, 120)
        assert.deepEqual(mergedFromStaleSnapshot.lastManagementEditFields, ['callsign'])

        assert.equal(mergedFromFreshEngine.heading, 90)
        assert.equal(mergedFromFreshEngine.callsign, 'VIP01')
        assert.deepEqual(
            mergedFromFreshEngine.lastManagementEditFields.sort(),
            ['callsign', 'heading'],
        )
        assert.ok(mergedFromFreshEngine.lastUserKinematicEditAt > 0)
    })
})

describe('track management window live sync', () => {
    it('maps live track fields into window updates', () => {
        assert.deepEqual(getTrackManagementWindowLiveUpdatesFromTrack(existingTrack({
            longitude: -77.5,
            latitude: 39.2,
            heading: 275,
            speed: 510,
            altitude: 28_000,
            callsign: 'VIP01',
            correlationMode: 'extrapolated',
        })), {
            lngLat: {
                lng: -77.5,
                lat: 39.2,
            },
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'VIP01',
            heading: 275,
            speed: 510,
            altitude: 28_000,
            infoFields: false,
            correlationMode: 'extrapolated',
            attentionFlags: [],
            iffMode3Code: null,
            iffMode3UpdatedAt: null,
        })
    })

    it('syncs live track data into open windows', () => {
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'CIV01',
            heading: 45,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'auto',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                longitude: -76.2,
                latitude: 41.1,
                heading: 180,
                speed: 500,
                altitude: 15_000,
            })],
        )

        assert.equal(syncedWindows.length, 1)
        assert.equal(syncedWindows[0].heading, 180)
        assert.equal(syncedWindows[0].speed, 500)
        assert.equal(syncedWindows[0].altitude, 15_000)
        assert.equal(syncedWindows[0].lngLat.lng, -76.2)
        assert.equal(syncedWindows[0].lngLat.lat, 41.1)
    })

    it('skips fields that are actively being edited', () => {
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'CIV01',
            heading: 45,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'auto',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                heading: 180,
                speed: 500,
                altitude: 15_000,
            })],
            {
                'track-AUTO-1': new Set(['heading', 'speed']),
            },
        )

        assert.equal(syncedWindows[0].heading, 45)
        assert.equal(syncedWindows[0].speed, 420)
        assert.equal(syncedWindows[0].altitude, 15_000)
    })

    it('expands skip fields for coupled select edits', () => {
        assert.deepEqual(
            [...expandTrackManagementWindowSkipLiveFields(new Set(['domain']))].sort(),
            ['domain', 'specificType', 'type'],
        )
        assert.deepEqual(
            [...expandTrackManagementWindowSkipLiveFields(new Set(['type']))].sort(),
            ['specificType', 'type'],
        )
    })

    it('skips coupled fields while domain is being edited', () => {
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'CIV01',
            heading: 45,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'auto',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                domain: 'land',
                type: '01:120101',
                specificType: 'M1A2',
            })],
            {
                'track-AUTO-1': expandTrackManagementWindowSkipLiveFields(new Set(['domain'])),
            },
        )

        assert.equal(syncedWindows[0].domain, 'air')
        assert.equal(syncedWindows[0].type, '01:110104')
        assert.equal(syncedWindows[0].specificType, 'F-16C')
    })

    it('prefers map layer tracks for committed manual edits during live sync', () => {
        const simulationTracks = [existingTrack({
            callsign: 'CIV01',
            domain: 'air',
            source: 'auto',
        })]
        const committedTrack = existingTrack({
            callsign: 'VIP01',
            domain: 'land',
            source: 'manual',
            userDirected: true,
        })

        const mergedTracks = mergeLiveTracksForManagementWindowSync(
            simulationTracks,
            [{trackId: 'AUTO-1'}],
            (trackId) => (trackId === 'AUTO-1' ? committedTrack : null),
        )

        assert.equal(mergedTracks.length, 1)
        assert.equal(mergedTracks[0].callsign, 'VIP01')
        assert.equal(mergedTracks[0].domain, 'land')
    })

    it('keeps live simulation kinematics after metadata-only edits', () => {
        const mergedTrack = mergeUserDirectedLayerTrackOverSimulation(
            existingTrack({
                heading: 180,
                speed: 500,
                altitude: 15_000,
                longitude: -76.2,
                latitude: 41.1,
            }),
            existingTrack({
                callsign: 'VIP01',
                heading: 45,
                speed: 420,
                altitude: 12_000,
                longitude: -75,
                latitude: 40,
                userDirected: true,
                lastManagementEditFields: ['callsign'],
            }),
        )

        assert.equal(mergedTrack.callsign, 'VIP01')
        assert.equal(mergedTrack.heading, 180)
        assert.equal(mergedTrack.speed, 500)
        assert.equal(mergedTrack.altitude, 15_000)
        assert.equal(mergedTrack.longitude, -76.2)
        assert.equal(mergedTrack.latitude, 41.1)
    })

    it('preserves user-edited kinematics from the map layer', () => {
        const now = 10_000
        const mergedTrack = mergeUserDirectedLayerTrackOverSimulation(
            existingTrack({
                heading: 120,
                speed: 470,
                altitude: 13_000,
                lastUserKinematicEditAt: now - 1_000,
            }),
            existingTrack({
                heading: 90,
                speed: 470,
                altitude: 13_000,
                userDirected: true,
                lastManagementEditFields: ['heading'],
                lastUserKinematicEditAt: now - 1_000,
            }),
            now,
        )

        assert.equal(mergedTrack.heading, 90)
        assert.equal(mergedTrack.speed, 470)
    })

    it('does not revive expired kinematic skip fields from stale layer tracks', () => {
        const now = 20_000
        const mergedTrack = mergeUserDirectedLayerTrackOverSimulation(
            existingTrack({
                heading: 180,
                speed: 500,
                altitude: 15_000,
                lastManagementEditFields: ['callsign'],
                lastUserKinematicEditAt: 5_000,
            }),
            existingTrack({
                heading: 90,
                speed: 420,
                altitude: 12_000,
                userDirected: true,
                lastManagementEditFields: ['heading', 'callsign'],
                lastUserKinematicEditAt: 5_000,
            }),
            now,
        )

        assert.equal(mergedTrack.heading, 180)
        assert.equal(mergedTrack.speed, 500)
        assert.deepEqual(mergedTrack.lastManagementEditFields, ['callsign'])
    })

    it('keeps simulation tracks for open auto tracks without manual edits', () => {
        const simulationTracks = [existingTrack({
            heading: 180,
            source: 'auto',
        })]
        const layerTrack = existingTrack({
            heading: 45,
            source: 'auto',
        })

        const mergedTracks = mergeLiveTracksForManagementWindowSync(
            simulationTracks,
            [{trackId: 'AUTO-1'}],
            () => layerTrack,
        )

        assert.equal(mergedTracks[0].heading, 180)
    })

    it('expands skip fields for committed management edits', () => {
        const now = 10_000

        assert.deepEqual(
            [...expandSkipFieldsWithCommittedManagementEdits(
                new Set(),
                ['heading', 'domain'],
                {
                    lastManagementEditFields: ['heading', 'domain'],
                    lastUserKinematicEditAt: now - 1_000,
                },
                now,
            )].sort(),
            ['domain', 'heading', 'specificType', 'type'],
        )
    })

    it('ignores expired kinematic fields when expanding live-sync skip fields', () => {
        const now = 20_000

        assert.deepEqual(
            [...expandSkipFieldsWithCommittedManagementEdits(
                new Set(),
                ['heading', 'callsign'],
                {
                    lastManagementEditFields: ['heading', 'callsign'],
                    lastUserKinematicEditAt: 5_000,
                },
                now,
            )].sort(),
            ['callsign'],
        )
    })

    it('maps committed position fields to lngLat live-sync skips', () => {
        assert.deepEqual(
            [...expandSkipFieldsWithCommittedManagementEdits(new Set(), ['longitude', 'latitude'])].sort(),
            ['lngLat'],
        )
    })

    it('normalizes stale cross-domain type and specific type values on track updates', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                domain: 'surface',
                type: '01:110104',
                specificType: 'F-16C',
            }),
            existingTrack({
                domain: 'air',
                type: '01:110104',
                specificType: 'F-16C',
            }),
            ['domain', 'type', 'specificType'],
        )

        assert.equal(updated.domain, 'surface')
        assert.equal(updated.type, '30:000000')
        assert.equal(updated.specificType, '')
    })

    it('does not revive expired kinematic skip fields on metadata-only updates', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                callsign: 'VIP01',
            }),
            existingTrack({
                callsign: 'CIV01',
                lastManagementEditFields: ['heading', 'callsign'],
                lastUserKinematicEditAt: 5_000,
            }),
            ['callsign'],
        )

        assert.deepEqual(updated.lastManagementEditFields, ['callsign'])
        assert.equal(updated.lastUserKinematicEditAt, undefined)
        assert.equal(updated.lastUserKinematicEditFields, undefined)
    })

    it('evaluates existing hold expiry using simulation time', () => {
        const editAt = 10_000

        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                callsign: 'VIP01',
            }),
            existingTrack({
                callsign: 'CIV01',
                lastManagementEditFields: ['heading'],
                lastUserKinematicEditAt: editAt,
                lastUserKinematicEditFields: ['heading'],
            }),
            ['callsign'],
            editAt + 5_000,
        )

        assert.deepEqual(
            updated.lastManagementEditFields.sort(),
            ['callsign', 'heading'],
        )
        assert.equal(updated.lastUserKinematicEditAt, editAt)
        assert.deepEqual(updated.lastUserKinematicEditFields, ['heading'])
    })

    it('does not overwrite committed kinematic edits during live sync', () => {
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'CIV01',
            heading: 90,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'manual',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                heading: 180,
                speed: 500,
                altitude: 15_000,
                userDirected: true,
                lastManagementEditFields: ['heading'],
                lastUserKinematicEditAt: Date.now() - 1_000,
            })],
        )

        assert.equal(syncedWindows[0].heading, 90)
        assert.equal(syncedWindows[0].speed, 500)
        assert.equal(syncedWindows[0].altitude, 15_000)
    })

    it('evaluates live-sync skip fields using simulation time', () => {
        const editAt = 10_000
        const evaluationTime = editAt + 5_000
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'CIV01',
            heading: 90,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'auto',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                heading: 180,
                speed: 500,
                altitude: 15_000,
                lastManagementEditFields: ['heading'],
                lastUserKinematicEditAt: editAt,
                lastUserKinematicEditFields: ['heading'],
            })],
            {},
            evaluationTime,
        )

        assert.equal(syncedWindows[0].heading, 90)
        assert.equal(syncedWindows[0].speed, 500)
        assert.equal(syncedWindows[0].altitude, 15_000)
    })

    it('preserves earlier committed fields after a later edit', () => {
        const openWindow = {
            id: 'track-AUTO-1',
            trackId: 'AUTO-1',
            x: 100,
            y: 200,
            lngLat: {
                lng: -75,
                lat: 40,
            },
            line: null,
            domain: 'air',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16C',
            callsign: 'VIP01',
            heading: 90,
            speed: 420,
            altitude: 12_000,
            infoFields: false,
            correlationMode: 'active',
            source: 'manual',
            dismissOnMapClick: false,
        }

        const syncedWindows = syncTrackManagementWindowsFromTracks(
            [openWindow],
            [existingTrack({
                callsign: 'CIV01',
                heading: 180,
                speed: 500,
                altitude: 15_000,
                userDirected: true,
                lastManagementEditFields: ['heading', 'callsign'],
                lastUserKinematicEditAt: Date.now() - 1_000,
            })],
        )

        assert.equal(syncedWindows[0].heading, 90)
        assert.equal(syncedWindows[0].callsign, 'VIP01')
        assert.equal(syncedWindows[0].speed, 500)
        assert.equal(syncedWindows[0].altitude, 15_000)
    })

    it('unions committed edit fields when merging simulation and layer tracks', () => {
        const now = 10_000
        const mergedTrack = mergeUserDirectedLayerTrackOverSimulation(
            existingTrack({
                heading: 180,
                lastManagementEditFields: ['heading'],
                lastUserKinematicEditAt: now - 1_000,
            }),
            existingTrack({
                callsign: 'VIP01',
                userDirected: true,
                lastManagementEditFields: ['callsign'],
                lastUserKinematicEditAt: now - 1_000,
            }),
            now,
        )

        assert.deepEqual(
            mergedTrack.lastManagementEditFields.sort(),
            ['callsign', 'heading'],
        )
    })
})
