import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getServerUnsupportedDevice,
    isUnsupportedMobileDevice,
    isUnsupportedMobileDeviceFromDeviceType,
    isUnsupportedMobileDeviceFromUserAgent,
    isUnsupportedTouchPrimaryDevice,
} from '../../app/tools/browser/deviceSupport.js'

describe('isUnsupportedMobileDeviceFromUserAgent', () => {
    it('detects common mobile and tablet user agents', () => {
        assert.equal(
            isUnsupportedMobileDeviceFromUserAgent(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            ),
            true,
        )
        assert.equal(
            isUnsupportedMobileDeviceFromUserAgent(
                'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
            ),
            true,
        )
        assert.equal(
            isUnsupportedMobileDeviceFromUserAgent(
                'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            ),
            true,
        )
    })

    it('does not flag desktop browsers', () => {
        assert.equal(
            isUnsupportedMobileDeviceFromUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            ),
            false,
        )
        assert.equal(
            isUnsupportedMobileDeviceFromUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            ),
            false,
        )
    })
})

describe('isUnsupportedMobileDeviceFromDeviceType', () => {
    it('flags mobile and tablet device types', () => {
        assert.equal(isUnsupportedMobileDeviceFromDeviceType('mobile'), true)
        assert.equal(isUnsupportedMobileDeviceFromDeviceType('tablet'), true)
        assert.equal(isUnsupportedMobileDeviceFromDeviceType('desktop'), false)
        assert.equal(isUnsupportedMobileDeviceFromDeviceType(undefined), false)
    })
})

describe('isUnsupportedTouchPrimaryDevice', () => {
    it('flags touch-primary devices regardless of viewport width', () => {
        assert.equal(isUnsupportedTouchPrimaryDevice(true, true), true)
        assert.equal(isUnsupportedTouchPrimaryDevice(true, false), false)
        assert.equal(isUnsupportedTouchPrimaryDevice(false, true), false)
        assert.equal(isUnsupportedTouchPrimaryDevice(false, false), false)
    })
})

describe('isUnsupportedMobileDevice', () => {
    it('returns true when the server already flagged the device', () => {
        assert.equal(isUnsupportedMobileDevice(true), true)
    })

    it('returns false on the server when the device is not flagged', () => {
        assert.equal(isUnsupportedMobileDevice(false), false)
    })
})

describe('getServerUnsupportedDevice', () => {
    it('uses the user-agent header when present', () => {
        const headersList = new Headers({
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        })

        assert.equal(getServerUnsupportedDevice(headersList), true)
    })

    it('uses the sec-ch-ua-mobile hint when present', () => {
        const headersList = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'sec-ch-ua-mobile': '?1',
        })

        assert.equal(getServerUnsupportedDevice(headersList), true)
    })

    it('returns false for desktop requests', () => {
        const headersList = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'sec-ch-ua-mobile': '?0',
        })

        assert.equal(getServerUnsupportedDevice(headersList), false)
    })
})
