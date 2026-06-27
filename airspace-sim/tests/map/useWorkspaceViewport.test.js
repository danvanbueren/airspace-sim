import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    WORKSPACE_RESIZE_IDLE_MS,
    WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS,
} from '../../app/constants/workspaceViewport.js'
import {getWorkspaceContainerSize} from '../../app/tools/map/workspaceContainerSize.js'

describe('useWorkspaceViewport', () => {
    it('uses a throttled layout interval slower than the idle settle window', () => {
        assert.ok(WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS >= 50)
        assert.ok(WORKSPACE_RESIZE_LAYOUT_THROTTLE_MS <= WORKSPACE_RESIZE_IDLE_MS)
    })
})

describe('getWorkspaceContainerSize', () => {
    it('reads the measured container size when available', () => {
        const containerRef = {
            current: {
                clientWidth: 1280,
                clientHeight: 720,
            },
        }

        assert.deepEqual(getWorkspaceContainerSize(containerRef), {
            width: 1280,
            height: 720,
        })
    })
})
