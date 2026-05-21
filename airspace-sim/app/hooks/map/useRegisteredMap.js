'use client'

import {useEffect} from 'react'

export function useRegisteredMap(mapRef, mapReady, registerMap) {
    useEffect(() => {
        if (!mapReady) return

        registerMap(mapRef.current)

        return () => {
            registerMap(null)
        }
    }, [mapReady, mapRef, registerMap])
}