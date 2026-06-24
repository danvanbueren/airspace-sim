import {headers} from 'next/headers'
import {userAgent} from 'next/server'
import DeviceSupportGate from './components/global/DeviceSupportGate'
import Home from './Home'
import {
    getServerUnsupportedDevice,
    isUnsupportedMobileDeviceFromDeviceType,
} from './utils/deviceSupport'

export default async function Page() {
    const headersList = await headers()
    const {device} = userAgent({headers: headersList})
    const initialUnsupported = getServerUnsupportedDevice(headersList)
        || isUnsupportedMobileDeviceFromDeviceType(device.type)

    return (
        <DeviceSupportGate initialUnsupported={initialUnsupported}>
            <Home/>
        </DeviceSupportGate>
    )
}
