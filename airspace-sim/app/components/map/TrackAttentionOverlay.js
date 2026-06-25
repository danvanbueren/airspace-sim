'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {Box} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {getVisibleTrackAttentionFlags} from '@/app/simulation/trackAttentionFlags'
import {
    ATTENTION_AMBER,
    formatAttentionDisplayEntries,
} from '@/app/tools/map/trackAttentionDisplay'
import {useAttentionFlashVisible} from '@/app/hooks/map/useAttentionFlashVisible'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

const TRACK_ATTENTION_OFFSET_X = 28
const TRACK_ATTENTION_OFFSET_Y = -8

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
    evaluationTime = Date.now(),
    iffRefreshMs = 1000,
}) {
    const {appSettings} = useAppSettings()
    const flashVisible = useAttentionFlashVisible(true)
    const [positionsByTrackId, setPositionsByTrackId] = useState({})

    const inhibitedAttentionIds = appSettings.inhibitedAttentions ?? []

    const tracksWithAttentions = useMemo(() => (
        tracks
            .map((track) => {
                const trackId = getTrackId(track)
                const flagIds = getVisibleTrackAttentionFlags(
                    track,
                    evaluationTime,
                    inhibitedAttentionIds,
                    iffRefreshMs ?? appSettings.iffRefreshMs ?? 1000,
                )

                if (!trackId || flagIds.length === 0) {
                    return null
                }

                return {
                    trackId,
                    flagIds,
                    displayEntries: formatAttentionDisplayEntries(flagIds),
                }
            })
            .filter(Boolean)
    ), [tracks, evaluationTime, inhibitedAttentionIds, iffRefreshMs, appSettings.iffRefreshMs])

    const updatePositions = useCallback(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        const nextPositions = {}

        for (const track of tracks) {
            const trackId = getTrackId(track)
            const coordinates = getTrackCoordinates(track)

            if (!trackId || !coordinates) {
                continue
            }

            const flagIds = getVisibleTrackAttentionFlags(
                track,
                evaluationTime,
                inhibitedAttentionIds,
                iffRefreshMs ?? appSettings.iffRefreshMs ?? 1000,
            )

            if (flagIds.length === 0) {
                continue
            }

            const projected = map.project(coordinates)

            nextPositions[trackId] = {
                left: projected.x + TRACK_ATTENTION_OFFSET_X,
                top: projected.y + TRACK_ATTENTION_OFFSET_Y,
            }
        }

        setPositionsByTrackId(nextPositions)
    }, [evaluationTime, iffRefreshMs, inhibitedAttentionIds, appSettings.iffRefreshMs, mapReady, mapRef, tracks])

    useEffect(() => {
        updatePositions()
    }, [updatePositions])

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
            {tracksWithAttentions.map(({trackId, displayEntries}) => {
                const position = positionsByTrackId[trackId]

                if (!position) {
                    return null
                }

                return (
                    <Box
                        key={trackId}
                        sx={{
                            position: 'absolute',
                            left: position.left,
                            top: position.top,
                            zIndex: UI_Z_INDEX.MAP_OVERLAY,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            opacity: flashVisible ? 1 : 0,
                            transition: 'opacity 0.05s linear',
                        }}
                    >
                        {displayEntries.map((entry) => (
                            <Box
                                key={`${trackId}-${entry.key}`}
                                sx={{
                                    color: ATTENTION_AMBER,
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    fontSize: '0.72rem',
                                    lineHeight: 1.25,
                                    whiteSpace: 'nowrap',
                                    textShadow: '0 0 4px rgba(0, 0, 0, 0.85)',
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
