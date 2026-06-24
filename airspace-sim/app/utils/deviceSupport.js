const MOBILE_TABLET_UA_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i

export function isUnsupportedMobileDeviceFromUserAgent(userAgentString = '') {
    if (!userAgentString) {
        return false
    }

    return MOBILE_TABLET_UA_PATTERN.test(userAgentString)
}

export function isUnsupportedMobileDeviceFromDeviceType(deviceType) {
    return deviceType === 'mobile' || deviceType === 'tablet'
}

export function isUnsupportedMobileDevice(initialUnsupported = false) {
    return initialUnsupported || isUnsupportedMobileDeviceClient()
}

export function isUnsupportedMobileDeviceClient() {
    if (typeof window === 'undefined') {
        return false
    }

    const userAgentString = navigator.userAgent ?? ''

    if (isUnsupportedMobileDeviceFromUserAgent(userAgentString)) {
        return true
    }

    const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

    if (isIPad) {
        return true
    }

    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const hasNoHover = window.matchMedia('(hover: none)').matches
    const isNarrowTabletViewport = window.matchMedia('(max-width: 1024px)').matches

    return hasCoarsePointer && hasNoHover && isNarrowTabletViewport
}

export function getServerUnsupportedDevice(headersList) {
    const userAgentString = headersList.get('user-agent') ?? ''

    if (isUnsupportedMobileDeviceFromUserAgent(userAgentString)) {
        return true
    }

    const deviceType = headersList.get('sec-ch-ua-mobile')

    if (deviceType === '?1') {
        return true
    }

    return false
}
