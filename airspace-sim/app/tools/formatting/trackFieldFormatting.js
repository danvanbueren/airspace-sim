export function parseWholeNumberInput(value) {
    if (value === '' || value === null || value === undefined) {
        return ''
    }

    const cleaned = String(value).replaceAll(',', '').trim()

    if (cleaned === '') {
        return ''
    }

    const number = Math.round(Number(cleaned))

    return Number.isFinite(number) ? number : ''
}

export function normalizeHeading(value) {
    const parsed = parseWholeNumberInput(value)

    if (parsed === '') {
        return 0
    }

    return ((parsed % 360) + 360) % 360
}

export function formatWholeNumberWithCommas(value) {
    const parsed = parseWholeNumberInput(value)

    if (parsed === '') {
        return ''
    }

    return parsed.toLocaleString('en-US')
}

export function formatHeadingDisplay(value) {
    return String(normalizeHeading(value))
}

export function formatEditableWholeNumber(value) {
    const parsed = parseWholeNumberInput(value)

    return parsed === '' ? '' : String(parsed)
}

export function formatAltitudeFeet(value) {
    return formatWholeNumberWithCommas(value)
}

export function formatSpeedKnots(value) {
    return formatWholeNumberWithCommas(value)
}

export function parseTrackKinematicFields(track) {
    return {
        heading: normalizeHeading(track.heading ?? 0),
        speed: track.speed === '' || track.speed === null || track.speed === undefined
            ? ''
            : parseWholeNumberInput(track.speed),
        altitude: track.altitude === '' || track.altitude === null || track.altitude === undefined
            ? ''
            : parseWholeNumberInput(track.altitude),
    }
}
