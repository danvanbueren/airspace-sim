'use client'

import {useEffect} from 'react'
import {useAttentionFlashVisible} from '@/app/hooks/map/useAttentionFlashVisible'

export default function TrackAttentionOverlay({
    mapRef,
    mapReady,
    tracks = [],
    evaluationTime = 0,
    iffRefreshMs = 1000,
}) {
    const flashVisible = useAttentionFlashVisible(true)

    useEffect(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        const layerId = 'tracks-attentions'

        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'text-opacity', flashVisible ? 1 : 0)
        }
    }, [flashVisible, mapReady, mapRef])

    return null
}
