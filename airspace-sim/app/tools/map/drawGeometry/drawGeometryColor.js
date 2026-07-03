export const DEFAULT_DRAW_GEOMETRY_STROKE_COLORS = {
    dark: '#ffffff',
    light: '#111111',
}

function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)))
}

function parseHexColor(color) {
    const normalized = String(color ?? '').trim()

    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
        return null
    }

    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16),
    }
}

function toHexColor({r, g, b}) {
    const channel = (value) => clampChannel(value).toString(16).padStart(2, '0')

    return `#${channel(r)}${channel(g)}${channel(b)}`
}

function relativeLuminance({r, g, b}) {
    const channel = (value) => {
        const normalized = value / 255

        return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
    }

    return (0.2126 * channel(r)) + (0.7152 * channel(g)) + (0.0722 * channel(b))
}

export function createDefaultStrokeColorsByMode() {
    return {...DEFAULT_DRAW_GEOMETRY_STROKE_COLORS}
}

export function getStrokeColorForMode(colorsByMode, mode) {
    return colorsByMode?.[mode] ?? DEFAULT_DRAW_GEOMETRY_STROKE_COLORS[mode]
}

export function convertStrokeColorForOppositeMode(color, fromMode) {
    const parsed = parseHexColor(color)

    if (!parsed) {
        const fallback = DEFAULT_DRAW_GEOMETRY_STROKE_COLORS[fromMode === 'dark' ? 'light' : 'dark']

        return fallback
    }

    const luminance = relativeLuminance(parsed)

    if (fromMode === 'dark') {
        if (luminance > 0.65) {
            return toHexColor({
                r: 255 - parsed.r,
                g: 255 - parsed.g,
                b: 255 - parsed.b,
            })
        }

        return toHexColor({
            r: parsed.r * 0.2,
            g: parsed.g * 0.2,
            b: parsed.b * 0.2,
        })
    }

    if (luminance < 0.35) {
        return toHexColor({
            r: 255 - parsed.r,
            g: 255 - parsed.g,
            b: 255 - parsed.b,
        })
    }

    return toHexColor({
        r: 255 - (parsed.r * 0.25),
        g: 255 - (parsed.g * 0.25),
        b: 255 - (parsed.b * 0.25),
    })
}

export function setStrokeColorForMode(colorsByMode, mode, color) {
    const oppositeMode = mode === 'dark' ? 'light' : 'dark'

    return {
        ...colorsByMode,
        [mode]: color,
        [oppositeMode]: convertStrokeColorForOppositeMode(color, mode),
    }
}

export function createDefaultFillColorsByMode() {
    return {
        dark: '#ffffff',
        light: '#111111',
    }
}

export function setFillColorForMode(colorsByMode, mode, color) {
    const oppositeMode = mode === 'dark' ? 'light' : 'dark'

    return {
        ...colorsByMode,
        [mode]: color,
        [oppositeMode]: convertStrokeColorForOppositeMode(color, mode),
    }
}
