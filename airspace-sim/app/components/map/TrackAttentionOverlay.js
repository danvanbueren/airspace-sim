'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, useTheme} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {getVisibleTrackAttentionFlags} from '@/app/simulation/trackAttentionFlags'
import {
    formatAttentionDisplayEntries,
    getAttentionMapLabelStyles,
    projectTrackAttentionCopies,
    trackAttentionInstancesAreEqual,
} from '@/app/tools/map/trackAttentionDisplay'
import {useAttentionFlashVisible} from '@/app/hooks/map/useAttentionFlashVisible'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

const EMPTY_INHIBITED_ATTENTIONS = []

function getTrackCoordinates(track) {
    if (Array.isArray(track.coordinates) && track.coordinates.length >= 2) {
        return track.coordinates
    }

    if (Number.isFinite(track.longitude) && Number.isFinite(track.latitude)) {
        return [track.longitude, track.latitude]
    }

    return null
}

function getTrackId(track) {
    return track.id ?? track.trackId
}

export default function TrackAttentionOverlay({
    mapRef,
    mapReady,
    tracks = [],
    evaluationTime = 0,
    iffRefreshMs = 1000,
}) {
    const {appSettings} = useAppSettings()
    const theme = useTheme()
    const flashVisible = useAttentionFlashVisible(true)
    const [attentionInstances, setAttentionInstances] = useState({})
    const attentionMapLabelStyles = useMemo(
        () => getAttentionMapLabelStyles(theme.palette.mode),
        [theme.palette.mode],
    )

    const inhibitedAttentionIds = appSettings.inhibitedAttentions ?? EMPTY_INHIBITED_ATTENTIONS
    const resolvedIffRefreshMs = iffRefreshMs ?? appSettings.iffRefreshMs ?? 1000

    const tracksWithAttentions = useMemo(() => (
        tracks
            .map((track) => {
                const trackId = getTrackId(track)
                const flagIds = getVisibleTrackAttentionFlags(
                    track,
                    evaluationTime,
                    inhibitedAttentionIds,
                    resolvedIffRefreshMs,
                )

                if (!trackId || flagIds.length === 0) {
                    return null
                }

                return {
                    trackId,
                    coordinates: getTrackCoordinates(track),
                    flagIds,
                    displayEntries: formatAttentionDisplayEntries(flagIds),
                }
            })
            .filter(Boolean)
    ), [tracks, evaluationTime, inhibitedAttentionIds, resolvedIffRefreshMs])

    const tracksWithAttentionsRef = useRef([])
    tracksWithAttentionsRef.current = tracksWithAttentions

    const displayEntriesByTrackId = useMemo(() => (
        Object.fromEntries(
            tracksWithAttentions.map(({trackId, displayEntries}) => [trackId, displayEntries]),
        )
    ), [tracksWithAttentions])

    const updatePositions = useCallback(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        const bounds = map.getBounds()
        const west = bounds.getWest()
        const east = bounds.getEast()
        const nextInstances = {}
        const currentActiveAttentions = tracksWithAttentionsRef.current

        for (const item of currentActiveAttentions) {
            const {trackId, coordinates} = item
            if (!coordinates) {
                continue
            }

            const projectedCopies = projectTrackAttentionCopies(
                map,
                trackId,
                coordinates,
                west,
                east,
            )

            for (const instance of projectedCopies) {
                nextInstances[instance.instanceKey] = {
                    trackId,
                    left: instance.left,
                    top: instance.top,
                }
            }
        }

        setAttentionInstances((previous) => (
            trackAttentionInstancesAreEqual(previous, nextInstances) ? previous : nextInstances
        ))
    }, [mapReady, mapRef])

    useEffect(() => {
        updatePositions()
    }, [tracks, evaluationTime, inhibitedAttentionIds, resolvedIffRefreshMs, mapReady, updatePositions])

    useEffect(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        map.on('move', updatePositions)
        map.on('zoom', updatePositions)
        map.on('rotate', updatePositions)
        map.on('pitch', updatePositions)
        map.on('resize', updatePositions)

        return () => {
            map.off('move', updatePositions)
            map.off('zoom', updatePositions)
            map.off('rotate', updatePositions)
            map.off('pitch', updatePositions)
            map.off('resize', updatePositions)
        }
    }, [mapReady, mapRef, updatePositions])

    if (tracksWithAttentions.length === 0) {
        return null
    }

    return (
        <>
            {Object.entries(attentionInstances).map(([instanceKey, {trackId, left, top}]) => {
                const displayEntries = displayEntriesByTrackId[trackId]

                if (!displayEntries) {
                    return null
                }

                return (
                    <Box
                        key={instanceKey}
                        sx={{
                            position: 'absolute',
                            left,
                            top,
                            zIndex: UI_Z_INDEX.MAP_OVERLAY,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            opacity: flashVisible ? 1 : 0,
                            transition: 'opacity 0.05s linear',
                        }}
                    >
                        {displayEntries.map((entry) => (
                            <Box
                                key={`${instanceKey}-${entry.key}`}
                                sx={{
                                    ...attentionMapLabelStyles,
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    fontSize: '0.72rem',
                                    lineHeight: 1.25,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {entry.label}
                            </Box>
                        ))}
                    </Box>
                )
            })}
        </>
    )
}

