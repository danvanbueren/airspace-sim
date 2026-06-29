'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, useTheme} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {getVisibleTrackAttentionFlags} from '@/app/simulation/trackAttentionFlags'
import {formatAttentionDisplayEntries, getAttentionMapLabelStyles} from '@/app/tools/map/trackAttentionDisplay'
import {useAttentionFlashVisible} from '@/app/hooks/map/useAttentionFlashVisible'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

const TRACK_ATTENTION_OFFSET_X = 28
const TRACK_ATTENTION_OFFSET_Y = -8
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

function positionsAreEqual(previous, next) {
    const nextKeys = Object.keys(next)

    if (Object.keys(previous).length !== nextKeys.length) {
        return false
    }

    return nextKeys.every((trackId) => {
        const previousPosition = previous[trackId]
        const nextPosition = next[trackId]

        return previousPosition
            && nextPosition
            && previousPosition.left === nextPosition.left
            && previousPosition.top === nextPosition.top
    })
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
    const [positionsByTrackId, setPositionsByTrackId] = useState({})
    const attentionMapLabelStyles = useMemo(
        () => getAttentionMapLabelStyles(theme.palette.mode),
        [theme.palette.mode],
    )

    const inhibitedAttentionIds = appSettings.inhibitedAttentions ?? EMPTY_INHIBITED_ATTENTIONS
    const resolvedIffRefreshMs = iffRefreshMs ?? appSettings.iffRefreshMs ?? 1000

    const tracksRef = useRef(tracks)
    const evaluationTimeRef = useRef(evaluationTime)
    const inhibitedAttentionIdsRef = useRef(inhibitedAttentionIds)
    const iffRefreshMsRef = useRef(resolvedIffRefreshMs)

    tracksRef.current = tracks
    evaluationTimeRef.current = evaluationTime
    inhibitedAttentionIdsRef.current = inhibitedAttentionIds
    iffRefreshMsRef.current = resolvedIffRefreshMs

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
                    flagIds,
                    displayEntries: formatAttentionDisplayEntries(flagIds),
                }
            })
            .filter(Boolean)
    ), [tracks, evaluationTime, inhibitedAttentionIds, resolvedIffRefreshMs])

    const updatePositions = useCallback(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        const nextPositions = {}
        const currentTracks = tracksRef.current
        const currentEvaluationTime = evaluationTimeRef.current
        const currentInhibitedAttentionIds = inhibitedAttentionIdsRef.current
        const currentIffRefreshMs = iffRefreshMsRef.current

        for (const track of currentTracks) {
            const trackId = getTrackId(track)
            const coordinates = getTrackCoordinates(track)

            if (!trackId || !coordinates) {
                continue
            }

            const flagIds = getVisibleTrackAttentionFlags(
                track,
                currentEvaluationTime,
                currentInhibitedAttentionIds,
                currentIffRefreshMs,
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

        setPositionsByTrackId((previous) => (
            positionsAreEqual(previous, nextPositions) ? previous : nextPositions
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
