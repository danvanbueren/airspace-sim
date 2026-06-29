import {ACTION_PANEL_ITEM_IDS} from '../../actionPanels/actionPanelRegistry.js'

export const GEOMETRY_SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    SQUARE: 'square',
    CIRCLE: 'circle',
    OVAL: 'oval',
    RACETRACK: 'racetrack',
    POLYGON: 'polygon',
}

export const GEOMETRY_STATUS = {
    PENDING: 'pending',
    COMMITTED: 'committed',
}

export const DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE = {
    [ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE]: GEOMETRY_SHAPE_TYPES.RECTANGLE,
    [ACTION_PANEL_ITEM_IDS.DRAW_SQUARE]: GEOMETRY_SHAPE_TYPES.SQUARE,
    [ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE]: GEOMETRY_SHAPE_TYPES.CIRCLE,
    [ACTION_PANEL_ITEM_IDS.DRAW_OVAL]: GEOMETRY_SHAPE_TYPES.OVAL,
    [ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK]: GEOMETRY_SHAPE_TYPES.RACETRACK,
    [ACTION_PANEL_ITEM_IDS.DRAW_POLYGON]: GEOMETRY_SHAPE_TYPES.POLYGON,
}

export const GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM = Object.fromEntries(
    Object.entries(DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE).map(([itemId, type]) => [type, itemId]),
)

export const GEOMETRY_SHAPE_TYPE_LABELS = {
    [GEOMETRY_SHAPE_TYPES.RECTANGLE]: 'Rectangle',
    [GEOMETRY_SHAPE_TYPES.SQUARE]: 'Square',
    [GEOMETRY_SHAPE_TYPES.CIRCLE]: 'Circle',
    [GEOMETRY_SHAPE_TYPES.OVAL]: 'Oval',
    [GEOMETRY_SHAPE_TYPES.RACETRACK]: 'Racetrack',
    [GEOMETRY_SHAPE_TYPES.POLYGON]: 'Polygon',
}

export const GEOMETRY_DRAWING_INSTRUCTIONS = {
    [GEOMETRY_SHAPE_TYPES.RECTANGLE]: 'Click the map to set the center, then click a corner to set size.',
    [GEOMETRY_SHAPE_TYPES.SQUARE]: 'Click the map to set the center, then click a corner to set size (1:1 aspect).',
    [GEOMETRY_SHAPE_TYPES.CIRCLE]: 'Click the map to set the origin, then click to set the radius.',
    [GEOMETRY_SHAPE_TYPES.OVAL]: 'Click the map to set the center, then click a corner to set the oval axes.',
    [GEOMETRY_SHAPE_TYPES.RACETRACK]: 'Click the first circle origin, the second circle origin, then click to set radius.',
    [GEOMETRY_SHAPE_TYPES.POLYGON]: 'Click to add vertices. Press Enter to finish, or click the first vertex to close the shape.',
}

export const GEOMETRY_HIT_TEST_PIXEL_RADIUS = 8

export const GEOMETRY_PENDING_OPACITY = 0.45

export const GEOMETRY_COMMITTED_OPACITY = 1

export const MIN_POLYGON_VERTICES = 2
