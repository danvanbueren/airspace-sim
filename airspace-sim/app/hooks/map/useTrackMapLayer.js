'use client'

import {useCallback, useEffect, useMemo, useRef} from 'react'
import {
    getMouseEventButton,
    mouseButtonMatchesBinding,
    useControlBindings,
} from '../../contexts/ControlBindingsContext'
import {usePerformanceInstrumentation} from '@/app/contexts/PerformanceMonitorContext'
import {addMilStd2525IconToMap} from '../../tools/milstd2525/createMilStd2525Icon'
import {
    getTrackSymbolCode,
    getTrackSymbolOptions,
} from '../../tools/milstd2525/trackSymbolCodes'
import {tracksToVectorFeatureCollection} from '../../simulation/trackVectorFeatures'
import {isReferencePoint} from '../../simulation/trackKinds'
import {
    MAP_CURSOR_PRIORITIES,
    MAP_CURSOR_REQUESTS,
} from './useMapCursorState'
import {isDarkMapStyle} from '../../tools/map/mapWaterLabelPaint'

const TRACK_SOURCE_ID = 'tracks'
const TRACK_VECTOR_SOURCE_ID = 'tracks-vectors'
const TRACK_VECTOR_LAYER_ID = 'tracks-vectors-lines'
const TRACK_LAYER_ID = 'tracks-symbols'
const TRACK_LABEL_LAYER_ID = 'tracks-labels'
const TRACK_HIT_TEST_PADDING = 6

function getTrackLabelPaint(styleKey) {
    if (isDarkMapStyle(styleKey)) {
        return {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2,
        }
    }

    return {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
    }
}

function applyTrackLabelPaint(map, styleKey) {
    if (!map.getLayer(TRACK_LABEL_LAYER_ID)) {
        return
    }

    const paint = getTrackLabelPaint(styleKey)

    map.setPaintProperty(TRACK_LABEL_LAYER_ID, 'text-color', paint['text-color'])
    map.setPaintProperty(TRACK_LABEL_LAYER_ID, 'text-halo-color', paint['text-halo-color'])
    map.setPaintProperty(TRACK_LABEL_LAYER_ID, 'text-halo-width', paint['text-halo-width'])
}

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
    const iconCacheOptions = getTrackIconCacheOptions(renderOptions)
    const renderOptionsHash = hashString(stableSerialize(iconCacheOptions))

    return [
        'milstd2525',
        symbolCode,
        renderOptionsHash,
    ].join(':')
}

function parseMilStd2525IconId(iconId) {
    if (typeof iconId !== 'string') {
        return null
    }

    const [prefix, symbolCode] = iconId.split(':')

    if (prefix !== 'milstd2525' || !symbolCode) {
        return null
    }

    return {symbolCode}
}

function getTrackIconCacheOptions(renderOptions) {
    if (renderOptions.useFamiliarIcon !== false && !renderOptions.infoFields) {
        return {
            size: renderOptions.size,
            domain: renderOptions.domain,
            identity: renderOptions.identity,
            type: renderOptions.type,
            useFamiliarIcon: renderOptions.useFamiliarIcon,
        }
    }

    return renderOptions
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

    const displayHeading = toFiniteNumber(track.heading, 0)

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
            heading: displayHeading,
            domain: track.domain ?? null,
            identity: track.identity ?? null,
            trackType: track.type ?? null,
            speed: track.speed ?? null,
            altitude: track.altitude ?? null,
            stale: isReferencePoint(track) ? false : Boolean(track.stale),
            selected: Boolean(track.selected),
            correlated: Boolean(track.correlated),
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

function addTrackVectorSource(map) {
    if (map.getSource(TRACK_VECTOR_SOURCE_ID)) {
        return
    }

    map.addSource(TRACK_VECTOR_SOURCE_ID, {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [],
        },
    })
}

function addTrackLayers(map) {
    if (!map.getLayer(TRACK_VECTOR_LAYER_ID)) {
        const vectorLayerBeforeId = map.getLayer(TRACK_LAYER_ID) ? TRACK_LAYER_ID : undefined

        map.addLayer({
            id: TRACK_VECTOR_LAYER_ID,
            type: 'line',
            source: TRACK_VECTOR_SOURCE_ID,
            paint: {
                'line-color': '#ffffff',
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 2,
                    10, 3.5,
                    16, 5,
                ],
                'line-opacity': [
                    'case',
                    ['boolean', ['get', 'stale'], false],
                    0.45,
                    1,
                ],
            },
            layout: {
                'line-cap': 'round',
            },
        }, vectorLayerBeforeId)
    }

    if (!map.getLayer(TRACK_LAYER_ID)) {
        map.addLayer({
            id: TRACK_LAYER_ID,
            type: 'symbol',
            source: TRACK_SOURCE_ID,
            layout: {
                'icon-image': ['get', 'icon'],
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4,
                    0.35,
                    10,
                    1,
                ],
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
                ...getTrackLabelPaint(),
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
    const {controlBindings} = useControlBindings()
    const performanceInstrumentation = usePerformanceInstrumentation()
    const mapCursorBindings = controlBindings.mapCursor

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
        mapCursor,
    } = options

    const onTrackClickRef = useRef(onTrackClick)

    useEffect(() => {
        onTrackClickRef.current = onTrackClick
    }, [onTrackClick])

    const applyTrackDataToMap = useCallback((map) => {
        if (!map?.getSource(TRACK_SOURCE_ID)) {
            return
        }

        const tracks = Array.from(tracksRef.current.values())
        const featureCollection = createFeatureCollection(tracks, iconSize)
        const vectorFeatureCollection = tracksToVectorFeatureCollection(tracks, map)

        const trackSymbolsStart = performance.now()
        getSource(map)?.setData(featureCollection)
        const trackSymbolsMs = performance.now() - trackSymbolsStart

        const trackVectorsStart = performance.now()
        map.getSource(TRACK_VECTOR_SOURCE_ID)?.setData(vectorFeatureCollection)
        const trackVectorsMs = performance.now() - trackVectorsStart

        performanceInstrumentation.recordTrackSetData({
            trackSymbolsMs,
            trackVectorsMs,
            trackFeatures: featureCollection.features.length,
            vectorFeatures: vectorFeatureCollection.features.length,
        })
    }, [iconSize, performanceInstrumentation])

    const scheduleSetData = useCallback(() => {
        if (frameRef.current) {
            return
        }

        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null

            const map = mapRef.current

            if (!map) {
                return
            }

            applyTrackDataToMap(map)
        })
    }, [applyTrackDataToMap, mapRef])

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

    const ensureTrackIconById = useCallback(async (iconId) => {
        const map = mapRef.current

        if (!map) {
            return
        }

        if (registeredIconIdsRef.current.has(iconId) || pendingIconIdsRef.current.has(iconId)) {
            return
        }

        if (map.hasImage(iconId)) {
            registeredIconIdsRef.current.add(iconId)
            return
        }

        const parsedIcon = parseMilStd2525IconId(iconId)

        if (!parsedIcon) {
            return
        }

        let matchingTrack = null

        tracksRef.current.forEach((track) => {
            if (matchingTrack) {
                return
            }

            const trackSymbolCode = track.symbolCode ?? getTrackSymbolCode(track)
            const trackIconId = track.iconId ?? getTrackIconId(track, trackSymbolCode, iconSize)

            if (trackIconId === iconId) {
                matchingTrack = {
                    ...track,
                    symbolCode: trackSymbolCode,
                    iconId: trackIconId,
                }
            }
        })

        const symbolCode = matchingTrack?.symbolCode ?? parsedIcon.symbolCode
        const renderOptions = matchingTrack
            ? getTrackIconRenderOptions(matchingTrack, iconSize)
            : {size: iconSize}

        pendingIconIdsRef.current.add(iconId)

        try {
            const addedIcon = await addMilStd2525IconToMap(
                map,
                iconId,
                symbolCode,
                renderOptions,
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
        addTrackVectorSource(map)
        addTrackLayers(map)
        applyTrackLabelPaint(map, styleKey)

        if (!showLabels && map.getLayer(TRACK_LABEL_LAYER_ID)) {
            map.setLayoutProperty(TRACK_LABEL_LAYER_ID, 'visibility', 'none')
        } else if (showLabels && map.getLayer(TRACK_LABEL_LAYER_ID)) {
            map.setLayoutProperty(TRACK_LABEL_LAYER_ID, 'visibility', 'visible')
        }

        scheduleSetData()

        tracksRef.current.forEach((track) => {
            ensureTrackIcon(track)
        })
    }, [ensureTrackIcon, mapRef, scheduleSetData, showLabels, styleKey])

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

    const replaceTracks = useCallback((tracks) => {
        tracksRef.current.clear()

        tracks.forEach((track) => {
            const id = getTrackId(track)

            if (!id) {
                return
            }

            tracksRef.current.set(id, {
                ...track,
                id,
            })
        })

        tracksRef.current.forEach((track) => {
            ensureTrackIcon(track)
        })

        scheduleSetData()
    }, [ensureTrackIcon, scheduleSetData])

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

        const handleStyleImageMissing = (event) => {
            if (!event?.id) {
                return
            }

            ensureTrackIconById(event.id)
        }

        rehydrateTrackLayer()

        const handleViewChange = () => {
            scheduleSetData()
        }

        map.on('style.load', handleStyleLoad)
        map.once('idle', handleIdle)
        map.on('styleimagemissing', handleStyleImageMissing)
        map.on('move', handleViewChange)
        map.on('zoom', handleViewChange)

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('styleimagemissing', handleStyleImageMissing)
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
        }
    }, [ensureTrackIconById, ensureTrackLayer, mapReady, mapRef, styleKey])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        const map = mapRef.current
        const canvas = map.getCanvas()
        let trackPress = null

        const queryTrackAtMapPoint = (mapPoint) => {
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
        }

        const getMapPointFromEvent = (event) => {
            const bounds = canvas.getBoundingClientRect()

            return {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }
        }

        const clearTrackPress = () => {
            trackPress = null
        }

        const handleMouseDown = (event) => {
            if (event.shiftKey && event.button === 0) {
                return
            }

            if (!mouseButtonMatchesBinding(getMouseEventButton(event), mapCursorBindings.grabButton)) {
                clearTrackPress()
                return
            }

            const track = queryTrackAtMapPoint(getMapPointFromEvent(event))

            if (!track) {
                clearTrackPress()
                return
            }

            trackPress = {
                trackId: getTrackId(track),
            }
        }

        const handleMouseMove = (event) => {
            if (!trackPress) {
                return
            }

            const track = queryTrackAtMapPoint(getMapPointFromEvent(event))

            if (!track || getTrackId(track) !== trackPress.trackId) {
                clearTrackPress()
            }
        }

        const handleMouseUp = (event) => {
            if (!trackPress) {
                return
            }

            if (!mouseButtonMatchesBinding(getMouseEventButton(event), mapCursorBindings.grabButton)) {
                clearTrackPress()
                return
            }

            const mapPoint = getMapPointFromEvent(event)
            const track = queryTrackAtMapPoint(mapPoint)
            const pressedTrackId = trackPress.trackId

            clearTrackPress()

            if (!track || getTrackId(track) !== pressedTrackId) {
                return
            }

            onTrackClickRef.current?.(track, {
                point: mapPoint,
                lngLat: map.unproject([mapPoint.x, mapPoint.y]),
                originalEvent: event,
            })
        }

        const handleTrackPointerEnter = () => {
            mapCursor?.requestCursor(
                MAP_CURSOR_REQUESTS.TRACK_HOVER,
                'pointer',
                MAP_CURSOR_PRIORITIES.HOVER,
            )
        }

        const handleTrackPointerLeave = () => {
            mapCursor?.clearCursorRequest(MAP_CURSOR_REQUESTS.TRACK_HOVER)
        }

        const registerLayerHandlers = () => {
            if (map.getLayer(TRACK_LAYER_ID)) {
                map.on('mouseenter', TRACK_LAYER_ID, handleTrackPointerEnter)
                map.on('mouseleave', TRACK_LAYER_ID, handleTrackPointerLeave)
            }

            if (map.getLayer(TRACK_LABEL_LAYER_ID)) {
                map.on('mouseenter', TRACK_LABEL_LAYER_ID, handleTrackPointerEnter)
                map.on('mouseleave', TRACK_LABEL_LAYER_ID, handleTrackPointerLeave)
            }
        }

        const unregisterLayerHandlers = () => {
            if (map.getLayer(TRACK_LAYER_ID)) {
                map.off('mouseenter', TRACK_LAYER_ID, handleTrackPointerEnter)
                map.off('mouseleave', TRACK_LAYER_ID, handleTrackPointerLeave)
            }

            if (map.getLayer(TRACK_LABEL_LAYER_ID)) {
                map.off('mouseenter', TRACK_LABEL_LAYER_ID, handleTrackPointerEnter)
                map.off('mouseleave', TRACK_LABEL_LAYER_ID, handleTrackPointerLeave)
            }
        }

        const refreshLayerHandlers = () => {
            unregisterLayerHandlers()
            registerLayerHandlers()
        }

        refreshLayerHandlers()

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('blur', clearTrackPress)

        map.on('style.load', refreshLayerHandlers)

        return () => {
            map.off('style.load', refreshLayerHandlers)
            unregisterLayerHandlers()
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('blur', clearTrackPress)
            clearTrackPress()
            mapCursor?.clearCursorRequest(MAP_CURSOR_REQUESTS.TRACK_HOVER)
        }
    }, [mapReady, mapRef, styleKey, mapCursor, mapCursorBindings.grabButton])

    return useMemo(() => ({
        sourceId: TRACK_SOURCE_ID,
        vectorSourceId: TRACK_VECTOR_SOURCE_ID,
        vectorLayerId: TRACK_VECTOR_LAYER_ID,
        layerId: TRACK_LAYER_ID,
        labelLayerId: TRACK_LABEL_LAYER_ID,
        upsertTrack,
        upsertTracks,
        removeTrack,
        clearTracks,
        replaceTracks,
        getTrack,
        getTracks,
        getTrackAtMapPoint,
    }), [
        clearTracks,
        replaceTracks,
        getTrack,
        getTrackAtMapPoint,
        getTracks,
        removeTrack,
        upsertTrack,
        upsertTracks,
    ])
}