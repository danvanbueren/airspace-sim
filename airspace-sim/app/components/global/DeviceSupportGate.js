'use client'

import {useEffect, useState} from 'react'
import UnsupportedMobilePage from '@/app/components/global/UnsupportedMobilePage'
import {isUnsupportedMobileDeviceClient} from '@/app/utils/deviceSupport'

export default function DeviceSupportGate({initialUnsupported = false, children}) {
    const [unsupported, setUnsupported] = useState(initialUnsupported)

    useEffect(() => {
        const updateUnsupportedState = () => {
            setUnsupported(
                initialUnsupported || isUnsupportedMobileDeviceClient(),
            )
        }

        updateUnsupportedState()
        window.addEventListener('resize', updateUnsupportedState)

        return () => {
            window.removeEventListener('resize', updateUnsupportedState)
        }
    }, [initialUnsupported])

    if (unsupported) {
        return <UnsupportedMobilePage/>
    }

    return children
}
