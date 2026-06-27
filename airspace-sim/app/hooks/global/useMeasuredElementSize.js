import {useEffect, useState} from 'react'

function readElementSize(element) {
    if (!element) {
        return {width: 0, height: 0}
    }

    const {width, height} = element.getBoundingClientRect()

    return {width, height}
}

export function useMeasuredElementSize(elementRef, dependencies = []) {
    const [size, setSize] = useState({width: 0, height: 0})

    useEffect(() => {
        const element = elementRef.current

        if (!element) {
            return
        }

        const updateSize = () => {
            const nextSize = readElementSize(element)

            setSize((currentSize) => {
                if (currentSize.width === nextSize.width && currentSize.height === nextSize.height) {
                    return currentSize
                }

                return nextSize
            })
        }

        updateSize()

        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(element)

        return () => {
            resizeObserver.disconnect()
        }
    }, [elementRef, ...dependencies])

    return size
}
