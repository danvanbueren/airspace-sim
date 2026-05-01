'use client'

import {useEffect, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function Home() {
    /* Holds the DOM element that MapLibre will use as its map container.
    ** React assigns this ref to the inner <div> rendered below.
    */
    const mapContainerRef = useRef(null)

    /* Holds the MapLibre map instance.
    ** Keeping this in a ref prevents unnecessary React re-renders and allows
    ** event handlers and cleanup logic to access the same map object.
    */
    const mapRef = useRef(null)

    /* Stores the latest cursor longitude/latitude independently from React state.
    ** This lets resize/zoom handlers recompute the overlay's screen position
    ** without depending on possibly stale state values.
    */
    const cursorLngLatRef = useRef(null)

    /* Stores the data needed to render the cursor coordinate overlay:
    ** - x/y: current screen position of the cursor or projected coordinate.
    ** - lng/lat: current geographic coordinate under the cursor.
    ** A null value hides the overlay.
    */
    const [cursorInfo, setCursorInfo] = useState(null)

    /* Format latitude values to a fixed-width string with five decimal places.
    ** Padding keeps the coordinate display aligned in the monospace overlay.
    */
    const formatLat = (value) => value.toFixed(5).padStart(10, ' ')

    /* Format longitude values to a fixed-width string with five decimal places.
    ** Padding keeps positive and negative values visually aligned.
    */
    const formatLng = (value) => value.toFixed(5).padStart(10, ' ')

    /* Initialize the MapLibre map once after the component mounts.
    ** The empty dependency array means this effect runs only once for the page
    ** lifecycle. The returned cleanup function removes listeners and destroys
    ** the map instance when the component unmounts.
    */
    useEffect(() => {
        /* Do nothing until React has attached the map container element.
        ** Also, avoid creating a second map if this effect is ever invoked again.
        */
        if (!mapContainerRef.current || mapRef.current)
            return

        /* Create the MapLibre map instance.
        ** The map is rendered into the container ref, uses a globe projection,
        ** loads a demo style, and starts centered on longitude 0 / latitude 0
        ** at a low zoom level so much of the earth is visible.
        */
        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: 'dark-matter-gl-style.json',
            center: [0, 0],
            zoom: 1
        })

        /* Recalculate the overlay's pixel position from the saved geographic
        ** cursor coordinate.
        ** This is needed when the map changes size or zoom level, because the
        ** same longitude/latitude projects to a different screen coordinate.
        */
        const updateCursorBoxPosition = () => {
            /* If the map is not ready or the cursor is not currently over the
            ** map, there is no overlay position to update.
            */
            if (!mapRef.current || !cursorLngLatRef.current)
                return

            /* Convert the stored geographic coordinate into screen pixels
            ** relative to the map container.
            */
            const point = mapRef.current.project(cursorLngLatRef.current)

            /* Update only the overlay's screen position while preserving the
            ** currently displayed latitude and longitude.
            */
            setCursorInfo((current) => {
                // If the overlay is hidden, keep it hidden.
                if (!current)
                    return current

                return {
                    ...current,
                    x: point.x,
                    y: point.y
                }
            })
        }

        /* Handle browser window resizes.
        ** MapLibre needs resize() called so it can adjust its canvas dimensions.
        ** After resizing the map, the coordinate overlay is repositioned to stay
        ** anchored near the same geographic cursor location.
        */
        const handleWindowResize = () => {
            mapRef.current?.resize()
            updateCursorBoxPosition()
        }

        /* Track mouse movement over the map.
        ** Each movement updates:
        ** - the cursor coordinate ref used by resize/zoom handlers,
        ** - React state used by the floating coordinate overlay,
        ** - the GeoJSON source used by the blue circle marker, if that source
        **   has already been created.
        */
        mapRef.current.on('mousemove', (e) => {
            /* Wrap longitude values so they remain within the standard world
            ** range when the map is panned around the globe.
            */
            const lngLat = e.lngLat.wrap()

            // Retrieve the dynamic GeoJSON point source added after map load.
            const pointSource = mapRef.current.getSource('point')

            /* Store the latest geographic cursor position for future projection
            ** updates triggered by zoom or resize events.
            */
            cursorLngLatRef.current = lngLat

            /* Show/update the floating cursor overlay using the current screen
            ** position and geographic coordinate from the mouse event.
            */
            setCursorInfo({
                x: e.point.x,
                y: e.point.y,
                lng: lngLat.lng,
                lat: lngLat.lat
            })

            /* If the marker source exists, move its point to the cursor's
            ** current longitude and latitude.
            */
            if (pointSource) {
                pointSource.setData({
                    'type': 'Point',
                    'coordinates': [lngLat.lng, lngLat.lat]
                })
            }
        })

        /* Hide the coordinate overlay when the cursor leaves the map area.
        ** Clearing the ref also prevents zoom/resize handlers from trying to
        ** reposition an overlay that is no longer visible.
        */
        mapRef.current.on('mouseout', () => {
            cursorLngLatRef.current = null
            setCursorInfo(null)
        })

        // Keep the overlay anchored correctly as the map zoom changes.
        mapRef.current.on('zoom', updateCursorBoxPosition)

        // Keep the overlay anchored correctly when MapLibre reports a resize.
        mapRef.current.on('resize', updateCursorBoxPosition)

        /* Listen for browser-level resize events so the map canvas and overlay
        ** remain correct when the viewport dimensions change.
        */
        window.addEventListener('resize', handleWindowResize)

        /* Add map data and styling after the base map style has loaded.
        ** Sources and layers must be added after the style is available.
        */
        mapRef.current.on('load', () => {
            /* Create a GeoJSON source containing a single point.
            ** The initial coordinate is temporary; it is moved to the cursor
            ** position as soon as the user moves the mouse over the map.
            */
            mapRef.current.addSource('point', {
                'type': 'geojson',
                'data': {
                    'type': 'Point',
                    'coordinates': [50, 0]
                }
            })
        })

        /* Cleanup function run when the component unmounts.
        ** This prevents leaked event listeners, removes the MapLibre map and
        ** canvas from the DOM, and clears the stored map instance.
        */
        return () => {
            window.removeEventListener('resize', handleWindowResize)
            mapRef.current?.off('zoom', updateCursorBoxPosition)
            mapRef.current?.off('resize', updateCursorBoxPosition)
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    /* Render a full-viewport map container and, when cursorInfo is available,
    ** an absolutely positioned coordinate overlay near the cursor.
    */
    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                margin: 0,
                padding: 0,
            }}
        >
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />

            {cursorInfo && (
                <div
                    style={{
                        position: 'absolute',
                        left: cursorInfo.x + 12,
                        top: cursorInfo.y + 12,

                        // Keep the overlay above the map canvas.
                        zIndex: 1,

                        padding: '6px 8px',
                        borderRadius: 4,
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#fff',
                        fontSize: 12,
                        fontFamily: 'monospace',

                        // Let mouse events pass through the overlay to the map.
                        pointerEvents: 'none',

                        // Preserve spacing from the padded coordinate strings.
                        whiteSpace: 'pre',
                    }}
                >
                    LAT: {formatLat(cursorInfo.lat)}<br/>
                    LNG: {formatLng(cursorInfo.lng)}
                </div>
            )}
        </div>
    )
}