import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    absoluteToEdgeAnchor,
    edgeAnchorToAbsolute,
    resolveEdgeAnchoredPosition,
} from '../../app/tools/map/edgeAnchoredPosition.js'

const CONTAINER = {width: 1000, height: 800}
const ELEMENT = {width: 300, height: 200}

describe('edgeAnchoredPosition', () => {
    it('anchors to the nearest edges', () => {
        const anchor = absoluteToEdgeAnchor(50, 60, CONTAINER, ELEMENT)

        assert.deepEqual(anchor, {
            horizontal: {edge: 'left', offset: 50},
            vertical: {edge: 'top', offset: 60},
        })
    })

    it('prefers right and bottom when closer to those edges', () => {
        const left = CONTAINER.width - ELEMENT.width - 20
        const top = CONTAINER.height - ELEMENT.height - 30
        const anchor = absoluteToEdgeAnchor(left, top, CONTAINER, ELEMENT)

        assert.deepEqual(anchor, {
            horizontal: {edge: 'right', offset: 20},
            vertical: {edge: 'bottom', offset: 30},
        })
    })

    it('restores the intended position after the viewport expands', () => {
        const anchor = absoluteToEdgeAnchor(
            CONTAINER.width - ELEMENT.width - 20,
            CONTAINER.height - ELEMENT.height - 56,
            CONTAINER,
            ELEMENT,
        )

        const shrunk = resolveEdgeAnchoredPosition(
            anchor,
            {width: 500, height: 400},
            ELEMENT,
            {minLeft: 8, minTop: 8, maxLeft: 192, maxTop: 192},
        )

        assert.deepEqual(shrunk, {left: 180, top: 144})

        const expanded = resolveEdgeAnchoredPosition(
            anchor,
            CONTAINER,
            ELEMENT,
            {
                minLeft: 8,
                minTop: 8,
                maxLeft: CONTAINER.width - ELEMENT.width - 20,
                maxTop: CONTAINER.height - ELEMENT.height - 8,
            },
        )

        assert.deepEqual(expanded, {
            left: CONTAINER.width - ELEMENT.width - 20,
            top: CONTAINER.height - ELEMENT.height - 56,
        })
    })

    it('round-trips through anchor conversion', () => {
        const position = {left: 120, top: 240}
        const anchor = absoluteToEdgeAnchor(position.left, position.top, CONTAINER, ELEMENT)
        const restored = edgeAnchorToAbsolute(anchor, CONTAINER, ELEMENT)

        assert.deepEqual(restored, position)
    })
})
