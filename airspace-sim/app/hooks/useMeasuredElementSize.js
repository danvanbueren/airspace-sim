import { useEffect, useState } from 'react'

export function useMeasuredElementSize(elementRef, dependencies = []) {
    const [size, setSize] = useState({width: 0, height: 0})

    useEffect(() => {
        if (!elementRef.current)
            return

        const {width, height} = elementRef.current.getBoundingClientRect()

        setSize({width, height})
    }, [elementRef, ...dependencies])

    return size
}