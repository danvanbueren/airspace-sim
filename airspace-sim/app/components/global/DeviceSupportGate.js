'use client'

import {useEffect, useState} from 'react'
import UnsupportedMobilePage from '@/app/components/global/UnsupportedMobilePage'
import {isUnsupportedMobileDevice} from '@/app/utils/deviceSupport'

export default function DeviceSupportGate({initialUnsupported = false, children}) {
    const [resizeTick, setResizeTick] = useState(0)

    useEffect(() => {
        const handleResize = () => {
            setResizeTick((tick) => tick + 1)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    void resizeTick

    if (isUnsupportedMobileDevice(initialUnsupported)) {
        return <UnsupportedMobilePage/>
    }

    return children
}
