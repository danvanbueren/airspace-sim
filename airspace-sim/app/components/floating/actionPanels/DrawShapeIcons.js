'use client'

import {Box} from '@mui/material'

const ICON_VIEW_BOX = '0 0 24 24'
const ICON_STROKE_WIDTH = 1.75

function ShapeIconSvg({children}) {
    return (
        <Box
            component='svg'
            viewBox={ICON_VIEW_BOX}
            aria-hidden
            sx={{
                width: 18,
                height: 18,
                flexShrink: 0,
                display: 'block',
            }}
        >
            {children}
        </Box>
    )
}

export function DrawRectangleIcon() {
    return (
        <ShapeIconSvg>
            <rect
                x='4'
                y='7'
                width='16'
                height='10'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
            />
        </ShapeIconSvg>
    )
}

export function DrawSquareIcon() {
    return (
        <ShapeIconSvg>
            <rect
                x='5'
                y='5'
                width='14'
                height='14'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
            />
        </ShapeIconSvg>
    )
}

export function DrawCircleIcon() {
    return (
        <ShapeIconSvg>
            <circle
                cx='12'
                cy='12'
                r='7'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
            />
        </ShapeIconSvg>
    )
}

export function DrawOvalIcon() {
    return (
        <ShapeIconSvg>
            <ellipse
                cx='12'
                cy='12'
                rx='9'
                ry='6'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
            />
        </ShapeIconSvg>
    )
}

export function DrawRacetrackIcon() {
    return (
        <ShapeIconSvg>
            <path
                d='M7 7h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
            />
        </ShapeIconSvg>
    )
}

export function DrawPolygonIcon() {
    return (
        <ShapeIconSvg>
            <polygon
                points='12,4 20,9 17,19 7,19 4,9'
                fill='none'
                stroke='currentColor'
                strokeWidth={ICON_STROKE_WIDTH}
                strokeLinejoin='round'
            />
        </ShapeIconSvg>
    )
}

export const DRAW_SHAPE_ICON_COMPONENTS = {
    DRAW_RECTANGLE: DrawRectangleIcon,
    DRAW_SQUARE: DrawSquareIcon,
    DRAW_CIRCLE: DrawCircleIcon,
    DRAW_OVAL: DrawOvalIcon,
    DRAW_RACETRACK: DrawRacetrackIcon,
    DRAW_POLYGON: DrawPolygonIcon,
}

export function getDrawShapeIconComponent(iconKey) {
    return DRAW_SHAPE_ICON_COMPONENTS[iconKey] ?? null
}
