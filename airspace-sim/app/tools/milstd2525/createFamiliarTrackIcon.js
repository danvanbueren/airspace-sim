'use client'

import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
    normalizeTrackType,
} from './trackSymbolCodes'

const DEFAULT_ICON_SIZE = 40

const TRACK_ICON_KINDS = {
    AIRCRAFT: 'aircraft',
    FIGHTER: 'fighter',
    TANKER: 'tanker',
    AEW: 'aew',
    SHIP: 'ship',
    SUBMARINE: 'submarine',
    GROUND: 'ground',
    SATELLITE: 'satellite',
    ACTIVITY: 'activity',
    CYBER: 'cyber',
}

const TRACK_TYPE_ICON_KINDS = {
    [TRACK_TYPES.AIR_UNSPECIFIED]: TRACK_ICON_KINDS.AIRCRAFT,
    [TRACK_TYPES.FIGHTER]: TRACK_ICON_KINDS.FIGHTER,
    [TRACK_TYPES.TANKER]: TRACK_ICON_KINDS.TANKER,
    [TRACK_TYPES.AWACS]: TRACK_ICON_KINDS.AEW,
    [TRACK_TYPES.SURFACE_COMBATANT]: TRACK_ICON_KINDS.SHIP,
    [TRACK_TYPES.SUBMARINE]: TRACK_ICON_KINDS.SUBMARINE,
    [TRACK_TYPES.GROUND_UNIT]: TRACK_ICON_KINDS.GROUND,
    [TRACK_TYPES.SPACE_UNIT]: TRACK_ICON_KINDS.SATELLITE,
    [TRACK_TYPES.ACTIVITY]: TRACK_ICON_KINDS.ACTIVITY,
    [TRACK_TYPES.CYBERSPACE]: TRACK_ICON_KINDS.CYBER,
}

const DOMAIN_ICON_KINDS = {
    [TRACK_DOMAINS.AIR]: TRACK_ICON_KINDS.AIRCRAFT,
    [TRACK_DOMAINS.LAND]: TRACK_ICON_KINDS.GROUND,
    [TRACK_DOMAINS.SURFACE]: TRACK_ICON_KINDS.SHIP,
    [TRACK_DOMAINS.SUBSURFACE]: TRACK_ICON_KINDS.SUBMARINE,
    [TRACK_DOMAINS.SPACE]: TRACK_ICON_KINDS.SATELLITE,
    [TRACK_DOMAINS.ACTIVITY]: TRACK_ICON_KINDS.ACTIVITY,
    [TRACK_DOMAINS.CYBERSPACE]: TRACK_ICON_KINDS.CYBER,
}

const IDENTITY_STYLES = {
    [TRACK_IDENTITIES.PENDING]: {
        stroke: '#ffd24d',
        fill: 'rgba(255, 210, 77, 0.24)',
    },
    [TRACK_IDENTITIES.UNKNOWN]: {
        stroke: '#ffd24d',
        fill: 'rgba(255, 210, 77, 0.24)',
    },
    [TRACK_IDENTITIES.ASSUMED_FRIENDLY]: {
        stroke: '#66c7ff',
        fill: 'rgba(102, 199, 255, 0.22)',
    },
    [TRACK_IDENTITIES.FRIENDLY]: {
        stroke: '#2ea7ff',
        fill: 'rgba(46, 167, 255, 0.22)',
    },
    [TRACK_IDENTITIES.NEUTRAL]: {
        stroke: '#61d36b',
        fill: 'rgba(97, 211, 107, 0.22)',
    },
    [TRACK_IDENTITIES.SUSPECT]: {
        stroke: '#ff9a3d',
        fill: 'rgba(255, 154, 61, 0.24)',
    },
    [TRACK_IDENTITIES.HOSTILE]: {
        stroke: '#ff5252',
        fill: 'rgba(255, 82, 82, 0.24)',
    },
}

function getIconKind({domain, type} = {}) {
    const normalizedType = normalizeTrackType(type, domain)

    return TRACK_TYPE_ICON_KINDS[normalizedType] ?? DOMAIN_ICON_KINDS[domain] ?? null
}

function createCanvas(size) {
    const canvas = document.createElement('canvas')

    canvas.width = size
    canvas.height = size

    return canvas
}

function createPath(pathCommands) {
    const path = new Path2D()

    pathCommands(path)

    return path
}

function addRoundedRect(path, x, y, width, height, radius) {
    const right = x + width
    const bottom = y + height

    path.moveTo(x + radius, y)
    path.lineTo(right - radius, y)
    path.quadraticCurveTo(right, y, right, y + radius)
    path.lineTo(right, bottom - radius)
    path.quadraticCurveTo(right, bottom, right - radius, bottom)
    path.lineTo(x + radius, bottom)
    path.quadraticCurveTo(x, bottom, x, bottom - radius)
    path.lineTo(x, y + radius)
    path.quadraticCurveTo(x, y, x + radius, y)
    path.closePath()
}

function drawOutlinedPath(ctx, path, style, options = {}) {
    ctx.save()
    ctx.fillStyle = options.fill ?? style.fill
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.lineWidth = (options.lineWidth ?? 4.5) + 4
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    if (options.fill !== false) {
        ctx.fill(path)
    }

    ctx.stroke(path)

    ctx.strokeStyle = style.stroke
    ctx.lineWidth = options.lineWidth ?? 4.5
    ctx.stroke(path)
    ctx.restore()
}

function drawOutlinedLine(ctx, drawLine, style, lineWidth = 4.5) {
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    drawLine(ctx)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.lineWidth = lineWidth + 4
    ctx.stroke()

    ctx.beginPath()
    drawLine(ctx)
    ctx.strokeStyle = style.stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
    ctx.restore()
}

function drawAircraft(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 8)
        iconPath.lineTo(58, 42)
        iconPath.lineTo(88, 56)
        iconPath.lineTo(88, 64)
        iconPath.lineTo(59, 60)
        iconPath.lineTo(55, 84)
        iconPath.lineTo(66, 92)
        iconPath.lineTo(50, 88)
        iconPath.lineTo(34, 92)
        iconPath.lineTo(45, 84)
        iconPath.lineTo(41, 60)
        iconPath.lineTo(12, 64)
        iconPath.lineTo(12, 56)
        iconPath.lineTo(42, 42)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, path, style)
}

function drawFighter(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 7)
        iconPath.lineTo(59, 43)
        iconPath.lineTo(92, 55)
        iconPath.lineTo(66, 64)
        iconPath.lineTo(58, 86)
        iconPath.lineTo(50, 93)
        iconPath.lineTo(42, 86)
        iconPath.lineTo(34, 64)
        iconPath.lineTo(8, 55)
        iconPath.lineTo(41, 43)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, path, style)
}

function drawTanker(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 9)
        iconPath.bezierCurveTo(56, 22, 57, 34, 57, 43)
        iconPath.lineTo(92, 52)
        iconPath.lineTo(92, 61)
        iconPath.lineTo(58, 59)
        iconPath.lineTo(55, 81)
        iconPath.lineTo(67, 90)
        iconPath.lineTo(50, 86)
        iconPath.lineTo(33, 90)
        iconPath.lineTo(45, 81)
        iconPath.lineTo(42, 59)
        iconPath.lineTo(8, 61)
        iconPath.lineTo(8, 52)
        iconPath.lineTo(43, 43)
        iconPath.bezierCurveTo(43, 34, 44, 22, 50, 9)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, path, style)
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(50, 67)
        lineCtx.lineTo(50, 96)
    }, style, 3.5)
}

function drawAew(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.arc(50, 50, 27, 0, Math.PI * 2)
    })

    drawOutlinedPath(ctx, path, style, {fill: false, lineWidth: 5})
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(25, 50)
        lineCtx.lineTo(75, 50)
    }, style, 5)
}

function drawShip(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 8)
        iconPath.bezierCurveTo(64, 20, 76, 42, 80, 64)
        iconPath.bezierCurveTo(70, 80, 59, 90, 50, 94)
        iconPath.bezierCurveTo(41, 90, 30, 80, 20, 64)
        iconPath.bezierCurveTo(24, 42, 36, 20, 50, 8)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, path, style)
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(36, 55)
        lineCtx.lineTo(64, 55)
        lineCtx.moveTo(42, 68)
        lineCtx.lineTo(58, 68)
    }, style, 3)
}

function drawSubmarine(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 8)
        iconPath.bezierCurveTo(62, 23, 68, 69, 50, 93)
        iconPath.bezierCurveTo(32, 69, 38, 23, 50, 8)
        iconPath.closePath()
    })
    const sailPath = createPath((iconPath) => {
        addRoundedRect(iconPath, 42, 44, 16, 18, 3)
    })

    drawOutlinedPath(ctx, path, style)
    drawOutlinedPath(ctx, sailPath, style, {lineWidth: 3.5})
}

function drawGround(ctx, style) {
    const hullPath = createPath((iconPath) => {
        addRoundedRect(iconPath, 21, 39, 58, 42, 8)
    })
    const turretPath = createPath((iconPath) => {
        addRoundedRect(iconPath, 37, 25, 26, 30, 6)
    })

    drawOutlinedPath(ctx, hullPath, style)
    drawOutlinedPath(ctx, turretPath, style, {lineWidth: 3.8})
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(50, 27)
        lineCtx.lineTo(50, 7)
    }, style, 4)
}

function drawSatellite(ctx, style) {
    const bodyPath = createPath((iconPath) => {
        iconPath.moveTo(50, 34)
        iconPath.lineTo(64, 50)
        iconPath.lineTo(50, 66)
        iconPath.lineTo(36, 50)
        iconPath.closePath()
    })
    const panelPath = createPath((iconPath) => {
        addRoundedRect(iconPath, 9, 41, 24, 18, 2)
        addRoundedRect(iconPath, 67, 41, 24, 18, 2)
    })

    drawOutlinedPath(ctx, panelPath, style, {lineWidth: 3.5})
    drawOutlinedPath(ctx, bodyPath, style)
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(33, 50)
        lineCtx.lineTo(36, 50)
        lineCtx.moveTo(64, 50)
        lineCtx.lineTo(67, 50)
        lineCtx.moveTo(50, 66)
        lineCtx.lineTo(50, 86)
    }, style, 3.5)
}

function drawActivity(ctx, style) {
    const path = createPath((iconPath) => {
        iconPath.moveTo(50, 11)
        iconPath.lineTo(60, 39)
        iconPath.lineTo(89, 39)
        iconPath.lineTo(65, 57)
        iconPath.lineTo(74, 86)
        iconPath.lineTo(50, 69)
        iconPath.lineTo(26, 86)
        iconPath.lineTo(35, 57)
        iconPath.lineTo(11, 39)
        iconPath.lineTo(40, 39)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, path, style)
}

function drawCyber(ctx, style) {
    const hexPath = createPath((iconPath) => {
        iconPath.moveTo(50, 10)
        iconPath.lineTo(83, 30)
        iconPath.lineTo(83, 70)
        iconPath.lineTo(50, 90)
        iconPath.lineTo(17, 70)
        iconPath.lineTo(17, 30)
        iconPath.closePath()
    })

    drawOutlinedPath(ctx, hexPath, style, {fill: false})
    drawOutlinedLine(ctx, (lineCtx) => {
        lineCtx.moveTo(50, 30)
        lineCtx.lineTo(50, 70)
        lineCtx.moveTo(32, 41)
        lineCtx.lineTo(68, 59)
        lineCtx.moveTo(68, 41)
        lineCtx.lineTo(32, 59)
    }, style, 3.8)
}

const ICON_DRAWERS = {
    [TRACK_ICON_KINDS.AIRCRAFT]: drawAircraft,
    [TRACK_ICON_KINDS.FIGHTER]: drawFighter,
    [TRACK_ICON_KINDS.TANKER]: drawTanker,
    [TRACK_ICON_KINDS.AEW]: drawAew,
    [TRACK_ICON_KINDS.SHIP]: drawShip,
    [TRACK_ICON_KINDS.SUBMARINE]: drawSubmarine,
    [TRACK_ICON_KINDS.GROUND]: drawGround,
    [TRACK_ICON_KINDS.SATELLITE]: drawSatellite,
    [TRACK_ICON_KINDS.ACTIVITY]: drawActivity,
    [TRACK_ICON_KINDS.CYBER]: drawCyber,
}

export function createFamiliarTrackIconCanvas(options = {}) {
    if (options.useFamiliarIcon === false || options.infoFields) {
        return null
    }

    const iconKind = getIconKind(options)
    const drawIcon = ICON_DRAWERS[iconKind]

    if (!drawIcon) {
        return null
    }

    const size = options.size ?? DEFAULT_ICON_SIZE
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')
    const style = IDENTITY_STYLES[options.identity] ?? IDENTITY_STYLES[TRACK_IDENTITIES.UNKNOWN]
    const scale = size / 100

    ctx.save()
    ctx.scale(scale, scale)
    drawIcon(ctx, style)
    ctx.restore()

    return canvas
}
