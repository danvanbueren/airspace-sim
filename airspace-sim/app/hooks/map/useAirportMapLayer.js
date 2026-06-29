'use client'

import {useCallback, useEffect, useRef} from 'react'

const AIRPORT_SOURCE_ID = 'sim-airports'
const AIRPORT_LAYER_ID = 'sim-airports-circles'

function airportsToFeatureCollection(airports) {
    const features = (airports ?? []).map((airport) => ({
        type: 'Feature',
        id: airport.icao,
        geometry: {
            type: 'Point',
            coordinates: [airport.lng, airport.lat],
        },
        properties: {
            icao: airport.icao,
            name: airport.name,
            class: airport.class,
        },
    }))

    return {type: 'FeatureCollection', features}
}

function addAirportSourceAndLayer(map) {
    if (!map.getSource(AIRPORT_SOURCE_ID)) {
        map.addSource(AIRPORT_SOURCE_ID, {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []},
        })
    }

    if (!map.getLayer(AIRPORT_LAYER_ID)) {
        map.addLayer({
            id: AIRPORT_LAYER_ID,
            type: 'circle',
            source: AIRPORT_SOURCE_ID,
            paint: {
                'circle-radius': [
                    'case',
                    ['==', ['get', 'class'], 'major'],
                    5,
                    ['==', ['get', 'class'], 'military'],
                    4,
                    3,
                ],
                'circle-color': [
                    'case',
                    ['==', ['get', 'class'], 'major'],
                    '#90caf9',
                    ['==', ['get', 'class'], 'military'],
                    '#ef9a9a',
                    '#81c784',
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.85,
            },
        })
    }
}

export function useAirportMapLayer(mapRef, mapReady, options = {}) {
    const {airports = [], visible = true, styleKey} = options
    const airportsRef = useRef(airports)

    useEffect(() => {
        airportsRef.current = airports
    }, [airports])

    const setVisibility = useCallback((map, isVisible) => {
        if (!map.getLayer(AIRPORT_LAYER_ID)) {
            return
        }

        map.setLayoutProperty(
            AIRPORT_LAYER_ID,
            'visibility',
            isVisible ? 'visible' : 'none',
        )
    }, [])

    const refreshData = useCallback(() => {
        const map = mapRef.current

        if (!map?.getSource) {
            return
        }

        addAirportSourceAndLayer(map)
        map.getSource(AIRPORT_SOURCE_ID)?.setData(
            airportsToFeatureCollection(airportsRef.current),
        )
        setVisibility(map, visible)
    }, [mapRef, setVisibility, visible])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        refreshData()
    }, [mapReady, mapRef, refreshData, styleKey, visible, airports])

    return {refreshData}
}
