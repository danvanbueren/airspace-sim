'use client'

import {useCallback, useEffect, useRef} from 'react'
import {buildAirportIndex, buildRoutePolyline} from '@/app/simulation/flightWorldUtils'

const AIR_ROUTE_SOURCE_ID = 'sim-air-routes'
const AIR_ROUTE_LAYER_ID = 'sim-air-routes-lines'

function routesToFeatureCollection(routes, airportByIcao) {
    const features = (routes ?? []).map((route) => {
        const polyline = buildRoutePolyline(route, airportByIcao)

        if (polyline.length < 2) {
            return null
        }

        return {
            type: 'Feature',
            id: route.id,
            geometry: {
                type: 'LineString',
                coordinates: polyline.map((point) => [point.lng, point.lat]),
            },
            properties: {
                id: route.id,
                origin: route.origin,
                destination: route.destination,
                weight: route.weight ?? 1,
                trafficKind: route.trafficKind ?? 'commercial',
            },
        }
    }).filter(Boolean)

    return {type: 'FeatureCollection', features}
}

function addAirRouteSourceAndLayer(map) {
    if (!map.getSource(AIR_ROUTE_SOURCE_ID)) {
        map.addSource(AIR_ROUTE_SOURCE_ID, {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []},
        })
    }

    if (!map.getLayer(AIR_ROUTE_LAYER_ID)) {
        map.addLayer({
            id: AIR_ROUTE_LAYER_ID,
            type: 'line',
            source: AIR_ROUTE_SOURCE_ID,
            paint: {
                'line-color': [
                    'case',
                    ['==', ['get', 'trafficKind'], 'military'],
                    '#ef5350',
                    '#64b5f6',
                ],
                'line-width': 1.2,
                'line-opacity': 0.45,
            },
        })
    }
}

export function useAirRouteMapLayer(mapRef, mapReady, options = {}) {
    const {routes = [], airports = [], visible = true, styleKey} = options
    const routesRef = useRef(routes)
    const airportsRef = useRef(airports)

    useEffect(() => {
        routesRef.current = routes
        airportsRef.current = airports
    }, [routes, airports])

    const setVisibility = useCallback((map, isVisible) => {
        if (!map.getLayer(AIR_ROUTE_LAYER_ID)) {
            return
        }

        map.setLayoutProperty(
            AIR_ROUTE_LAYER_ID,
            'visibility',
            isVisible ? 'visible' : 'none',
        )
    }, [])

    const refreshData = useCallback(() => {
        const map = mapRef.current

        if (!map?.getSource) {
            return
        }

        const airportByIcao = buildAirportIndex(airportsRef.current)

        addAirRouteSourceAndLayer(map)
        map.getSource(AIR_ROUTE_SOURCE_ID)?.setData(
            routesToFeatureCollection(routesRef.current, airportByIcao),
        )
        setVisibility(map, visible)
    }, [mapRef, setVisibility, visible])

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        refreshData()
    }, [mapReady, mapRef, refreshData, styleKey, visible, routes, airports])

    return {refreshData}
}
