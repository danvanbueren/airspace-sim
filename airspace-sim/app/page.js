import {headers} from 'next/headers'
import {userAgent} from 'next/server'
import DeviceSupportGate from './components/global/DeviceSupportGate'
import UnsupportedMobilePage from './components/global/UnsupportedMobilePage'
import {
    getServerUnsupportedDevice,
    isUnsupportedMobileDeviceFromDeviceType,
} from './utils/deviceSupport'

export default async function Page() {
    const headersList = await headers()
    const {device} = userAgent({headers: headersList})
    const initialUnsupported = getServerUnsupportedDevice(headersList)
        || isUnsupportedMobileDeviceFromDeviceType(device.type)

    if (initialUnsupported) {
        return <UnsupportedMobilePage/>
    }

    return <DeviceSupportGate/>
}
