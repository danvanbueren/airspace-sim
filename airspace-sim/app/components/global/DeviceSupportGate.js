'use client'

import {useLayoutEffect, useState} from 'react'
import Home from '@/app/Home'
import UnsupportedMobilePage from '@/app/components/global/UnsupportedMobilePage'
import {isUnsupportedMobileDeviceClient} from '@/app/tools/browser/deviceSupport'

export default function DeviceSupportGate() {
    const [clientReady, setClientReady] = useState(false)
    const [resizeTick, setResizeTick] = useState(0)

    useLayoutEffect(() => {
        setClientReady(true)

        const handleResize = () => {
            setResizeTick((tick) => tick + 1)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    void resizeTick

    if (!clientReady) {
        return null
    }

    if (isUnsupportedMobileDeviceClient()) {
        return <UnsupportedMobilePage/>
    }

    return <Home/>
}
