import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from './drawGeometryTypes.js'

export function getRacetrackAxisLinePreview({shape, phase, cursorPoint}) {
    if (!shape || shape.type !== GEOMETRY_SHAPE_TYPES.RACETRACK || shape.status === GEOMETRY_STATUS.COMMITTED) {
        return null
    }

    const {center1, center2} = shape.params ?? {}

    if (phase === 1 && center1 && cursorPoint) {
        return {
            from: center1,
            to: cursorPoint,
        }
    }

    if (phase === 2 && center1 && center2) {
        return {
            from: center1,
            to: center2,
        }
    }

    return null
}
