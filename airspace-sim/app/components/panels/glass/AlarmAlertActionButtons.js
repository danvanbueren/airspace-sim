'use client'

import {IconButton, Stack} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
    alertHasLink,
    alertHasTrackFocus,
    getAlertInhibitAriaLabel,
    getAlertLinkAriaLabel,
} from '@/app/tools/alerts/alarmAlertUi'

export default function AlarmAlertActionButtons({
    alert,
    onFocusTrack,
    onOpenLink,
    onInhibit,
    onDelete,
}) {
    const showTrackFocus = alertHasTrackFocus(alert)
    const showLink = alertHasLink(alert)

    return (
        <Stack direction='column' spacing={0} sx={{alignItems: 'center'}}>
            {showTrackFocus ? (
                <IconButton
                    size='small'
                    aria-label='center map on track'
                    onClick={onFocusTrack}
                >
                    <GpsFixedIcon fontSize='small'/>
                </IconButton>
            ) : null}
            {showLink ? (
                <IconButton
                    size='small'
                    aria-label={getAlertLinkAriaLabel(alert)}
                    onClick={onOpenLink}
                >
                    <OpenInNewIcon fontSize='small'/>
                </IconButton>
            ) : null}
            <IconButton
                size='small'
                aria-label={getAlertInhibitAriaLabel(alert)}
                onClick={onInhibit}
            >
                <NotificationsOffIcon fontSize='small'/>
            </IconButton>
            <IconButton
                size='small'
                aria-label='delete alarm'
                onClick={onDelete}
            >
                <DeleteIcon fontSize='small'/>
            </IconButton>
        </Stack>
    )
}
