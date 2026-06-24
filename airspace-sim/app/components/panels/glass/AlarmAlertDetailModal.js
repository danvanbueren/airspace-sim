'use client'

import {alpha, Box, IconButton, Modal, Stack, Typography} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import {formatDateTimeGroup} from '@/app/tools/formatting/DateTime'

const modalStyle = (theme) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(36rem, 90vw)',
    maxHeight: '80dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: alpha(theme.palette.background.paper, 0.75),
    backdropFilter: 'blur(10px)',
    borderRadius: 2,
    boxShadow: 24,
    p: 3,
    outline: 'none',
})

export default function AlarmAlertDetailModal({
    open,
    message,
    timestamp,
    signalLabel,
    showTrackFocus = false,
    onClose,
    onDelete,
    onFocusTrack,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={modalStyle}>
                <Stack direction='row' spacing={1} sx={{alignItems: 'flex-start', justifyContent: 'space-between'}}>
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'auto',
                            maxHeight: 'calc(80dvh - 6rem)',
                            pr: 1,
                        }}
                    >
                        {signalLabel && (
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    fontSize: 13,
                                    mb: 1,
                                }}
                            >
                                {signalLabel}
                            </Typography>
                        )}
                        <Typography
                            component='pre'
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 14,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                m: 0,
                            }}
                        >
                            {message}
                        </Typography>
                        {timestamp && (
                            <Typography
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: 14,
                                    mt: 2,
                                    opacity: 0.5,
                                }}
                            >
                                {formatDateTimeGroup(timestamp)}
                            </Typography>
                        )}
                    </Box>
                    <Stack direction='row' spacing={0.5} sx={{flexShrink: 0}}>
                        {showTrackFocus ? (
                            <IconButton
                                size='small'
                                aria-label='center map on track'
                                onClick={onFocusTrack}
                            >
                                <GpsFixedIcon fontSize='small'/>
                            </IconButton>
                        ) : null}
                        <IconButton
                            size='small'
                            aria-label='delete alarm'
                            onClick={onDelete}
                        >
                            <DeleteIcon fontSize='small'/>
                        </IconButton>
                    </Stack>
                </Stack>
            </Box>
        </Modal>
    )
}
