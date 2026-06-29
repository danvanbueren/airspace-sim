import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {
    filterInhibitedSignalIds,
    getSignalDefinition,
    getSignalLabel,
    sortSignalIdsByPriority,
} from '../../app/simulation/signalDefinitions.js'
import {
    deriveAttentionFlagsFromTrackState,
    resolveTrackAttentionFlags,
} from '../../app/simulation/trackAttentionFlags.js'
import {formatAttentionDisplayEntries, formatAttentionDisplayLines, getAttentionMapLabelStyles} from '../../app/tools/map/trackAttentionDisplay.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {TRACK_KINDS} from '../../app/simulation/trackKinds.js'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'

describe('signalDefinitions', () => {
    it('sorts attention flags by configured priority', () => {
        const sorted = sortSignalIdsByPriority(['EXTRAPOLATED', 'STALE', 'HOLD'])

        assert.deepEqual(sorted, ['STALE', 'EXTRAPOLATED', 'HOLD'])
    })

    it('filters inhibited signal ids', () => {
        const visible = filterInhibitedSignalIds(
            ['STALE', 'HOLD', 'SUSPENDED'],
            ['HOLD'],
        )

        assert.deepEqual(visible, ['STALE', 'SUSPENDED'])
    })

    it('falls back to Misc for unknown ids', () => {
        assert.equal(getSignalDefinition('UNKNOWN').id, 'MISC')
        assert.equal(getSignalLabel('UNKNOWN'), 'Misc')
    })
})

describe('trackAttentionFlags', () => {
    it('derives PEND while track identity is pending', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            identity: TRACK_IDENTITIES.PENDING,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        })

        assert.ok(flags.includes('PEND'))
    })

    it('removes PEND immediately when identity is no longer pending', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            identity: TRACK_IDENTITIES.UNKNOWN,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        })

        assert.ok(!flags.includes('PEND'))
    })

    it('derives PROT when drop protect is enabled', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            dropProtect: true,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        })

        assert.ok(flags.includes('PROT'))
    })

    it('does not derive DROP and PROT together for drop-protected tracks', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            dropProtect: true,
            dropAt: 5000,
            correlated: false,
        })

        assert.ok(flags.includes('PROT'))
        assert.ok(!flags.includes('DROP'))
    })

    it('does not derive SUSPENDED, PROT, or STALE for reference points', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            trackKind: TRACK_KINDS.REFERENCE_POINT,
            dropProtect: true,
            stale: true,
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
        })

        assert.ok(!flags.includes('SUSPENDED'))
        assert.ok(!flags.includes('PROT'))
        assert.ok(!flags.includes('STALE'))
    })

    it('derives stale, suspended, extrapolated, and hold flags from track state', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            stale: true,
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            lastUserKinematicEditAt: Date.now(),
        })

        assert.ok(flags.includes('STALE'))
        assert.ok(flags.includes('SUSPENDED'))
        assert.ok(flags.includes('HOLD'))
    })

    it('derives extrapolated attention from correlation mode', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            identity: TRACK_IDENTITIES.NEUTRAL,
            correlationMode: TRACK_CORRELATION_MODES.EXTRAPOLATED,
        })

        assert.ok(flags.includes('EXTRAPOLATED'))
        assert.ok(!flags.includes('PEND'))
    })

    it('merges assigned flags with derived flags without duplicates', () => {
        const flags = resolveTrackAttentionFlags({
            attentionFlags: ['HOLD'],
            stale: true,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        })

        assert.deepEqual(flags, ['STALE', 'HOLD'])
    })
})

describe('trackAttentionDisplay', () => {
    it('uses darker yellow with a black outline for light-mode map labels', () => {
        const styles = getAttentionMapLabelStyles('light')

        assert.equal(styles.color, '#C9A000')
        assert.match(styles.textShadow, /#000/)
    })

    it('keeps the amber glow styling for dark-mode map labels', () => {
        const styles = getAttentionMapLabelStyles('dark')

        assert.equal(styles.color, '#FFBF00')
        assert.match(styles.textShadow, /rgba\(0, 0, 0, 0\.85\)/)
    })

    it('shows up to five labels when within the display limit', () => {
        const lines = formatAttentionDisplayLines(['STALE', 'HOLD'])

        assert.deepEqual(lines, ['STALE', 'HOLD'])
    })

    it('shows four labels plus overflow summary when more than five flags exist', () => {
        const lines = formatAttentionDisplayLines([
            'STALE',
            'SUSPENDED',
            'EXTRAPOLATED',
            'HOLD',
            'DROP',
            'HOLD',
        ])

        assert.equal(lines.length, 5)
        assert.equal(lines[4], '+ 2 MORE')
    })

    it('assigns stable unique keys when multiple flags share a display label', () => {
        const entries = formatAttentionDisplayEntries(['IFF_STALE', 'STALE', 'HOLD'])

        assert.deepEqual(entries, [
            {key: 'IFF_STALE', label: 'STALE'},
            {key: 'STALE', label: 'STALE'},
            {key: 'HOLD', label: 'HOLD'},
        ])
    })
})
