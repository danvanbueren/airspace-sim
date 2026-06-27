import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getWorkspaceContainerSize} from '../../app/tools/map/workspaceContainerSize.js'

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
