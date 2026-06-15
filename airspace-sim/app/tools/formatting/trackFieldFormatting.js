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

export function formatWholeNumber(value) {
    if (value === '' || value === null || value === undefined) {
        return ''
    }

    const number = Math.round(Number(value))

    return Number.isFinite(number) ? String(number) : ''
}

export function formatAltitudeFeet(value) {
    const wholeNumber = formatWholeNumber(value)

    if (wholeNumber === '') {
        return ''
    }

    return Number(wholeNumber).toLocaleString('en-US')
}

export function formatTrackKinematicFields(track) {
    return {
        heading: formatWholeNumber(track.heading ?? 0),
        speed: track.speed === '' || track.speed === null || track.speed === undefined
            ? ''
            : formatWholeNumber(track.speed),
        altitude: track.altitude === '' || track.altitude === null || track.altitude === undefined
            ? ''
            : formatAltitudeFeet(track.altitude),
    }
}
