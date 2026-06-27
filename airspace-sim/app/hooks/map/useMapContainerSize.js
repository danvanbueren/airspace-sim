'use client'

import {useEffect, useState} from 'react'

function readContainerSize(mapContainerRef) {
    return {
        width: mapContainerRef.current?.clientWidth ?? 0,
        height: mapContainerRef.current?.clientHeight ?? 0,
    }
}

export function useMapContainerSize(mapContainerRef) {
    const [size, setSize] = useState(() => readContainerSize(mapContainerRef))

    useEffect(() => {
        const container = mapContainerRef.current

        if (!container) {
            return
        }

        const updateSize = () => {
            const nextSize = readContainerSize(mapContainerRef)

            setSize((currentSize) => (
                currentSize.width === nextSize.width && currentSize.height === nextSize.height
                    ? currentSize
                    : nextSize
            ))
        }

        updateSize()

        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(container)
        window.addEventListener('resize', updateSize)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener('resize', updateSize)
        }
    }, [mapContainerRef])

    return size
}
