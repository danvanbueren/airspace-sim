'use client'

import {useCallback, useEffect, useMemo, useRef} from 'react'
import {addMilStd2525IconToMap} from '../../tools/milstd2525/createMilStd2525Icon'
import {
    getTrackSymbolCode,
    getTrackSymbolOptions,
} from '../../tools/milstd2525/trackSymbolCodes'

const TRACK_SOURCE_ID = 'tracks'
const TRACK_LAYER_ID = 'tracks-symbols'
const TRACK_LABEL_LAYER_ID = 'tracks-labels'
const TRACK_HIT_TEST_PADDING = 6

function normalizeTrackCoordinates(track) {
    if (Array.isArray(track.coordinates) && track.coordinates.length >= 2) {
        return [track.coordinates[0], track.coordinates[1]]
    }

    if (Number.isFinite(track.longitude) && Number.isFinite(track.latitude)) {
        return [track.longitude, track.latitude]
    }

    if (Number.isFinite(track.lng) && Number.isFinite(track.lat)) {
        return [track.lng, track.lat]
    }

    return null
}

function getTrackId(track) {
    return track.id ?? track.trackId ?? track.mtiId
}

function toFiniteNumber(value, fallback = null) {
    if (value === '' || value === null || value === undefined) {
        return fallback
    }

    const number = Number(value)

    return Number.isFinite(number) ? number : fallback
}

function stableSerialize(value) {
    if (value === null || value === undefined) {
        return ''
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableSerialize).join(',')}]`
    }

    if (typeof value === 'object') {
        return `{${Object.keys(value).sort().map((key) => (
            `${key}:${stableSerialize(value[key])}`
        )).join(',')}}`
    }

    return String(value)
}

function hashString(value) {
    let hash = 0

    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
    }

    return Math.abs(hash).toString(36)
}

function getTrackIconRenderOptions(track, defaultIconSize) {
    const symbolOptions = {
        ...getTrackSymbolOptions(track),
        ...track.symbolOptions,
    }
    const trackId = getTrackId(track)

    return {
        size: track.iconSize ?? defaultIconSize,
        domain: track.domain,
        identity: track.identity,
        type: track.type,
        useFamiliarIcon: track.useFamiliarIcon ?? symbolOptions.useFamiliarIcon ?? true,
        label: track.iconLabel ?? (
            track.infoFields ? track.callsign ?? track.name ?? trackId : undefined
        ),
        heading: toFiniteNumber(track.iconHeading ?? track.heading),
        speed: track.iconSpeed ?? track.speed,
        altitude: track.iconAltitude ?? track.altitude,
        infoFields: track.infoFields ?? false,
        civilianColor: symbolOptions.civilianColor,
        symbolOptions,
    }
}

function getTrackIconId(track, symbolCode, defaultIconSize) {
    const renderOptions = getTrackIconRenderOptions(track, defaultIconSize)
    const renderOptionsHash = hashString(stableSerialize(renderOptions))

    return [
        'milstd2525',
        symbolCode,
        renderOptionsHash,
    ].join(':')
}

function trackToFeature(track, defaultIconSize) {
    const coordinates = normalizeTrackCoordinates(track)

    if (!coordinates) {
        return null
    }

    const id = getTrackId(track)

    if (!id) {
        return null
    }

    const symbolCode = track.symbolCode ?? getTrackSymbolCode(track)
    const iconId = track.iconId ?? getTrackIconId(track, symbolCode, defaultIconSize)

    return {
        type: 'Feature',
        id,
        geometry: {
            type: 'Point',
            coordinates,
        },
        properties: {
            id,
            trackId: id,
            icon: iconId,
            symbolCode,
            label: track.label ?? track.callsign ?? track.name ?? id,
            heading: toFiniteNumber(track.heading, 0),
            domain: track.domain ?? null,
            identity: track.identity ?? null,
            trackType: track.type ?? null,
            speed: track.speed ?? null,
            altitude: track.altitude ?? null,
            stale: Boolean(track.stale),
            selected: Boolean(track.selected),
        },
    }
}

function createFeatureCollection(tracks, defaultIconSize) {
    const features = []

    tracks.forEach((track) => {
        const feature = trackToFeature(track, defaultIconSize)

        if (feature) {
            features.push(feature)
        }
    })

    return {
        type: 'FeatureCollection',
        features,
    }
}

function getSource(map) {
    return map.getSource(TRACK_SOURCE_ID)
}

function addTrackSource(map) {
    if (map.getSource(TRACK_SOURCE_ID)) {
        return
    }

    map.addSource(TRACK_SOURCE_ID, {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [],
        },
    })
}

function addTrackLayers(map) {
    if (!map.getLayer(TRACK_LAYER_ID)) {
        map.addLayer({
            id: TRACK_LAYER_ID,
            type: 'symbol',
            source: TRACK_SOURCE_ID,
            layout: {
                'icon-image': ['get', 'icon'],
                'icon-size': 1,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-rotation-alignment': 'map',
                'icon-rotate': ['get', 'heading'],
            },
            paint: {
                'icon-opacity': [
                    'case',
                    ['boolean', ['get', 'stale'], false],
                    0.45,
                    1,
                ],
            },
        })
    }

    if (!map.getLayer(TRACK_LABEL_LAYER_ID)) {
        map.addLayer({
            id: TRACK_LABEL_LAYER_ID,
            type: 'symbol',
            source: TRACK_SOURCE_ID,
            layout: {
                'text-field': ['get', 'label'],
                'text-size': 12,
                'text-offset': [0, 1.8],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false,
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'text-opacity': [
                    'case',
                    ['boolean', ['get', 'stale'], false],
                    0.45,
                    1,
                ],
            },
        })
    }
}

export function useTrackMapLayer(mapRef, mapReady, options = {}) {
    const tracksRef = useRef(new Map())
    const registeredIconIdsRef = useRef(new Set())
    const pendingIconIdsRef = useRef(new Set())
    const frameRef = useRef(null)
    const rehydrateTimeoutRef = useRef(null)

    const {
        iconSize = 40,
        showLabels = true,
        styleKey,
        onTrackClick,
    } = options

    const onTrackClickRef = useRef(onTrackClick)

    useEffect(() => {
        onTrackClickRef.current = onTrackClick
    }, [onTrackClick])

    const scheduleSetData = useCallback(() => {
        if (frameRef.current) {
            return
        }

        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null

            const map = mapRef.current

            if (!map || !map.getSource(TRACK_SOURCE_ID)) {
                return
            }

            const source = getSource(map)
            const featureCollection = createFeatureCollection(tracksRef.current, iconSize)

            source?.setData(featureCollection)
        })
    }, [iconSize, mapRef])

    const ensureTrackIcon = useCallback(async (track) => {
        const map = mapRef.current

        if (!map) {
            return
        }

        const symbolCode = track.symbolCode ?? getTrackSymbolCode(track)
        const iconId = track.iconId ?? getTrackIconId(track, symbolCode, iconSize)

        if (registeredIconIdsRef.current.has(iconId)) {
            return
        }

        if (map.hasImage(iconId)) {
            registeredIconIdsRef.current.add(iconId)
            return
        }

        if (pendingIconIdsRef.current.has(iconId)) {
            return
        }

        pendingIconIdsRef.current.add(iconId)

        try {
            const addedIcon = await addMilStd2525IconToMap(
                map,
                iconId,
                symbolCode,
                getTrackIconRenderOptions(track, iconSize),
            )

            if (addedIcon) {
                registeredIconIdsRef.current.add(iconId)
                scheduleSetData()
            }
        } finally {
            pendingIconIdsRef.current.delete(iconId)
        }
    }, [iconSize, mapRef, scheduleSetData])

    const ensureTrackLayer = useCallback(() => {
        const map = mapRef.current

        if (!map || !map.isStyleLoaded()) return

        addTrackSource(map)
        addTrackLayers(map)

        if (!showLabels && map.getLayer(TRACK_LABEL_LAYER_ID)) {
            map.setLayoutProperty(TRACK_LABEL_LAYER_ID, 'visibility', 'none')
        } else if (showLabels && map.getLayer(TRACK_LABEL_LAYER_ID)) {
            map.setLayoutProperty(TRACK_LABEL_LAYER_ID, 'visibility', 'visible')
        }

        tracksRef.current.forEach((track) => {
            ensureTrackIcon(track)
        })

        scheduleSetData()
    }, [ensureTrackIcon, mapRef, scheduleSetData, showLabels])

    const upsertTrack = useCallback((track) => {
        const id = getTrackId(track)

        if (!id) {
            return
        }

        const mergedTrack = {
            ...tracksRef.current.get(id),
            ...track,
            id,
        }

        tracksRef.current.set(id, mergedTrack)

        ensureTrackIcon(mergedTrack)
        scheduleSetData()
    }, [ensureTrackIcon, scheduleSetData])

    const upsertTracks = useCallback((tracks) => {
        tracks.forEach((track) => {
            const id = getTrackId(track)

            if (!id) {
                return
            }

            const mergedTrack = {
                ...tracksRef.current.get(id),
                ...track,
                id,
            }

            tracksRef.current.set(id, mergedTrack)

            ensureTrackIcon(mergedTrack)
        })

        scheduleSetData()
    }, [ensureTrackIcon, scheduleSetData])

    const removeTrack = useCallback((trackId) => {
        tracksRef.current.delete(trackId)
        scheduleSetData()
    }, [scheduleSetData])

    const clearTracks = useCallback(() => {
        tracksRef.current.clear()
        scheduleSetData()
    }, [scheduleSetData])

    const getTrack = useCallback((trackId) => {
        return tracksRef.current.get(trackId)
    }, [])

    const getTracks = useCallback(() => {
        return Array.from(tracksRef.current.values())
    }, [])

    const getTrackAtMapPoint = useCallback((mapPoint) => {
        const map = mapRef.current

        if (!map || !mapPoint) {
            return null
        }

        const layers = [TRACK_LAYER_ID, TRACK_LABEL_LAYER_ID].filter((layerId) => map.getLayer(layerId))

        if (layers.length === 0) {
            return null
        }

        const {x, y} = mapPoint
        const features = map.queryRenderedFeatures([
            [x - TRACK_HIT_TEST_PADDING, y - TRACK_HIT_TEST_PADDING],
            [x + TRACK_HIT_TEST_PADDING, y + TRACK_HIT_TEST_PADDING],
        ], {layers})

        const trackId = features[0]?.properties?.trackId ?? features[0]?.properties?.id

        if (!trackId) {
            return null
        }

        return tracksRef.current.get(trackId) ?? null
    }, [mapRef])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const rehydrateTrackLayer = () => {
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

                registeredIconIdsRef.current.clear()
                pendingIconIdsRef.current.clear()

                ensureTrackLayer()
            }

            attemptRehydrate()
        }

        const handleStyleLoad = () => {
            rehydrateTrackLayer()
        }

        const handleIdle = () => {
            rehydrateTrackLayer()
        }

        rehydrateTrackLayer()

        map.on('style.load', handleStyleLoad)
        map.once('idle', handleIdle)

        return () => {
            map.off('style.load', handleStyleLoad)

            if (rehydrateTimeoutRef.current) {
                window.clearTimeout(rehydrateTimeoutRef.current)
                rehydrateTimeoutRef.current = null
            }

            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [ensureTrackLayer, mapReady, mapRef, styleKey])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const handleTrackClick = (event) => {
            const feature = event.features?.[0]
            const trackId = feature?.properties?.trackId ?? feature?.properties?.id

            if (!trackId) {
                return
            }

            const track = tracksRef.current.get(trackId)

            if (!track) {
                return
            }

            event.preventDefault()
            event.originalEvent?.stopPropagation?.()

            onTrackClickRef.current?.(track, event)
        }

        const handleTrackPointerEnter = () => {
            const canvas = map.getCanvas()

            canvas.dataset.cursorOverride = 'pointer'
            canvas.style.cursor = 'pointer'
        }

        const handleTrackPointerLeave = () => {
            const canvas = map.getCanvas()

            delete canvas.dataset.cursorOverride
            canvas.style.cursor = ''
        }

        const registerLayerHandlers = () => {
            if (map.getLayer(TRACK_LAYER_ID)) {
                map.on('click', TRACK_LAYER_ID, handleTrackClick)
                map.on('mouseenter', TRACK_LAYER_ID, handleTrackPointerEnter)
                map.on('mouseleave', TRACK_LAYER_ID, handleTrackPointerLeave)
            }

            if (map.getLayer(TRACK_LABEL_LAYER_ID)) {
                map.on('click', TRACK_LABEL_LAYER_ID, handleTrackClick)
                map.on('mouseenter', TRACK_LABEL_LAYER_ID, handleTrackPointerEnter)
                map.on('mouseleave', TRACK_LABEL_LAYER_ID, handleTrackPointerLeave)
            }
        }

        const unregisterLayerHandlers = () => {
            if (map.getLayer(TRACK_LAYER_ID)) {
                map.off('click', TRACK_LAYER_ID, handleTrackClick)
                map.off('mouseenter', TRACK_LAYER_ID, handleTrackPointerEnter)
                map.off('mouseleave', TRACK_LAYER_ID, handleTrackPointerLeave)
            }

            if (map.getLayer(TRACK_LABEL_LAYER_ID)) {
                map.off('click', TRACK_LABEL_LAYER_ID, handleTrackClick)
                map.off('mouseenter', TRACK_LABEL_LAYER_ID, handleTrackPointerEnter)
                map.off('mouseleave', TRACK_LABEL_LAYER_ID, handleTrackPointerLeave)
            }
        }

        const refreshLayerHandlers = () => {
            unregisterLayerHandlers()
            registerLayerHandlers()
        }

        refreshLayerHandlers()

        map.on('style.load', refreshLayerHandlers)

        return () => {
            map.off('style.load', refreshLayerHandlers)
            unregisterLayerHandlers()
        }
    }, [mapReady, mapRef, styleKey])

    return useMemo(() => ({
        sourceId: TRACK_SOURCE_ID,
        layerId: TRACK_LAYER_ID,
        labelLayerId: TRACK_LABEL_LAYER_ID,
        upsertTrack,
        upsertTracks,
        removeTrack,
        clearTracks,
        getTrack,
        getTracks,
        getTrackAtMapPoint,
    }), [
        clearTracks,
        getTrack,
        getTrackAtMapPoint,
        getTracks,
        removeTrack,
        upsertTrack,
        upsertTracks,
    ])
}