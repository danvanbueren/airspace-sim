'use client'

import {useCallback, useEffect, useMemo, useRef} from 'react'
import {SENSOR_TYPES} from '@/app/simulation/constants'
import {detectionsToFeatureCollection} from '@/app/simulation/detectionFeatures'

const SENSOR_SOURCES = {
    radarCurrent: 'sensor-radar-current',
    radarHistory: 'sensor-radar-history',
    iffCurrent: 'sensor-iff-current',
    iffHistory: 'sensor-iff-history',
}

const SENSOR_LAYERS = {
    radarCurrent: 'sensor-radar-current-lines',
    radarHistory: 'sensor-radar-history-lines',
    iffCurrent: 'sensor-iff-current-lines',
    iffHistory: 'sensor-iff-history-lines',
}

function addLineLayer(map, layerId, sourceId, defaultColor) {
    if (map.getLayer(layerId)) {
        return
    }

    map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': ['coalesce', ['get', 'color'], defaultColor],
            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                4, 1.5,
                8, 2.5,
                12, 4,
                16, 6,
            ],
            'line-opacity': layerId.includes('history') ? 0.6 : 1,
        },
        layout: {
            'line-cap': 'round',
        },
    })
}

function ensureSource(map, sourceId) {
    if (map.getSource(sourceId)) {
        return
    }

    map.addSource(sourceId, {
        type: 'geojson',
        data: {type: 'FeatureCollection', features: []},
    })
}

function moveSensorLayersToTop(map) {
    for (const layerId of Object.values(SENSOR_LAYERS)) {
        if (map.getLayer(layerId)) {
            map.moveLayer(layerId)
        }
    }
}

export function useSensorDetectionMapLayer(mapRef, mapReady, snapshot, styleKey) {
    const frameRef = useRef(null)
    const viewChangeFrameRef = useRef(null)
    const rehydrateTimeoutRef = useRef(null)
    const lastSnapshotRef = useRef(null)

    const applySnapshotToSources = useCallback((snap) => {
        const map = mapRef.current

        if (!map || !snap) {
            return false
        }

        if (!map.getSource(SENSOR_SOURCES.radarCurrent)) {
            return false
        }

        map.getSource(SENSOR_SOURCES.radarCurrent)?.setData(
            detectionsToFeatureCollection(snap.radar?.current ?? [], SENSOR_TYPES.RADAR, 'current', map),
        )
        map.getSource(SENSOR_SOURCES.radarHistory)?.setData(
            detectionsToFeatureCollection(snap.radar?.history ?? [], SENSOR_TYPES.RADAR, 'history', map),
        )
        map.getSource(SENSOR_SOURCES.iffCurrent)?.setData(
            detectionsToFeatureCollection(snap.iff?.current ?? [], SENSOR_TYPES.IFF, 'current', map),
        )
        map.getSource(SENSOR_SOURCES.iffHistory)?.setData(
            detectionsToFeatureCollection(snap.iff?.history ?? [], SENSOR_TYPES.IFF, 'history', map),
        )

        return true
    }, [mapRef])

    const ensureLayers = useCallback(() => {
        const map = mapRef.current

        if (!map?.isStyleLoaded()) {
            return false
        }

        ensureSource(map, SENSOR_SOURCES.radarCurrent)
        ensureSource(map, SENSOR_SOURCES.radarHistory)
        ensureSource(map, SENSOR_SOURCES.iffCurrent)
        ensureSource(map, SENSOR_SOURCES.iffHistory)

        addLineLayer(map, SENSOR_LAYERS.radarCurrent, SENSOR_SOURCES.radarCurrent, '#ffb300')
        addLineLayer(map, SENSOR_LAYERS.radarHistory, SENSOR_SOURCES.radarHistory, '#ffb300')
        addLineLayer(map, SENSOR_LAYERS.iffCurrent, SENSOR_SOURCES.iffCurrent, '#4caf50')
        addLineLayer(map, SENSOR_LAYERS.iffHistory, SENSOR_SOURCES.iffHistory, '#4caf50')

        moveSensorLayersToTop(map)

        return true
    }, [mapRef])

    const rehydrateSensorLayers = useCallback(() => {
        const map = mapRef.current

        if (!map) {
            return
        }

        if (rehydrateTimeoutRef.current) {
            window.clearTimeout(rehydrateTimeoutRef.current)
            rehydrateTimeoutRef.current = null
        }

        const attemptRehydrate = () => {
            if (!mapRef.current || mapRef.current !== map) {
                return
            }

            if (!map.isStyleLoaded()) {
                rehydrateTimeoutRef.current = window.setTimeout(attemptRehydrate, 50)
                return
            }

            if (!ensureLayers()) {
                rehydrateTimeoutRef.current = window.setTimeout(attemptRehydrate, 50)
                return
            }

            if (lastSnapshotRef.current) {
                applySnapshotToSources(lastSnapshotRef.current)
            }
        }

        attemptRehydrate()
    }, [applySnapshotToSources, ensureLayers, mapRef])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return undefined
        }

        const map = mapRef.current

        const handleStyleLoad = () => {
            rehydrateSensorLayers()
        }

        rehydrateSensorLayers()

        const handleViewChange = () => {
            if (!lastSnapshotRef.current || viewChangeFrameRef.current) {
                return
            }

            viewChangeFrameRef.current = requestAnimationFrame(() => {
                viewChangeFrameRef.current = null

                if (lastSnapshotRef.current) {
                    applySnapshotToSources(lastSnapshotRef.current)
                }
            })
        }

        map.on('style.load', handleStyleLoad)
        map.on('move', handleViewChange)
        map.on('zoom', handleViewChange)

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('move', handleViewChange)
            map.off('zoom', handleViewChange)

            if (rehydrateTimeoutRef.current) {
                window.clearTimeout(rehydrateTimeoutRef.current)
                rehydrateTimeoutRef.current = null
            }

            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }

            if (viewChangeFrameRef.current) {
                cancelAnimationFrame(viewChangeFrameRef.current)
                viewChangeFrameRef.current = null
            }
        }
    }, [applySnapshotToSources, mapReady, mapRef, rehydrateSensorLayers, styleKey])

    useEffect(() => {
        if (!snapshot) {
            return
        }

        lastSnapshotRef.current = snapshot

        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }

        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null

            if (!applySnapshotToSources(snapshot)) {
                rehydrateSensorLayers()
            }
        })
    }, [applySnapshotToSources, rehydrateSensorLayers, snapshot])

    return useMemo(() => ({
        layerIds: SENSOR_LAYERS,
        sourceIds: SENSOR_SOURCES,
    }), [])
}
