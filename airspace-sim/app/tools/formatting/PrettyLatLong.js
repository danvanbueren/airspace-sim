function formatDegrees(value) {
    return String(value).padStart(4, ' ')
}

function formatMinutes(value) {
    return String(value).padStart(2, '0')
}

function formatDecimalMinutes(value) {
    return value.toFixed(4).padStart(7, '0')
}

function formatSeconds(value) {
    return value.toFixed(2).padStart(5, '0')
}

export function formatDmsCoordinate(value, positiveSuffix, negativeSuffix) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.floor(absoluteValue)
    const minutesFloat = (absoluteValue - degrees) * 60
    const minutes = Math.floor(minutesFloat)
    const seconds = (minutesFloat - minutes) * 60
    const suffix = value >= 0 ? positiveSuffix : negativeSuffix

    return `${formatDegrees(degrees)}° ${formatMinutes(minutes)}' ${formatSeconds(seconds)}" ${suffix}`
}

export function formatDdmCoordinate(value) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.trunc(value)
    const minutes = (absoluteValue - Math.floor(absoluteValue)) * 60

    return `${formatDegrees(degrees)}° ${formatDecimalMinutes(minutes)}'`
}

export function formatDdCoordinate(value) {
    return `${value.toFixed(5).padStart(10, ' ')}°`
}
