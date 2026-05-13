export function parseCookieValue(value, fallbackValue) {
    if (!value) return fallbackValue

    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

export function writeCookieValue(name, value, options = {}) {
    const {
        path = '/',
        maxAge = 31536000,
        sameSite = 'Lax',
    } = options

    const cookieParts = [
        `${name}=${encodeURIComponent(value)}`,
        `Path=${path}`,
        `Max-Age=${maxAge}`,
        `SameSite=${sameSite}`,
    ]

    document.cookie = cookieParts.join('; ')
}

export function parseCookieJsonValue(value, fallbackValue) {
    if (!value) return fallbackValue

    if (typeof value === 'object') {
        return value
    }

    const parseAttempts = [
        () => JSON.parse(decodeURIComponent(value)),
        () => JSON.parse(value),
    ]

    for (const parseAttempt of parseAttempts) {
        try {
            return parseAttempt()
        } catch {
            // Try the next supported cookie format.
        }
    }

    return fallbackValue
}

export function writeCookieJsonValue(name, value, options = {}) {
    writeCookieValue(name, JSON.stringify(value), options)
}