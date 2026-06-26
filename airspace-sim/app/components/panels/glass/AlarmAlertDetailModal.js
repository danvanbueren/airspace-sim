'use client'

import {alpha, Box, Modal, Stack, Typography} from '@mui/material'
import AlarmAlertActionButtons from './AlarmAlertActionButtons'
import AlarmAlertMessageContent from './AlarmAlertMessageContent'
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
    messageIcon = null,
    timestamp,
    signalLabel,
    alert = null,
    onClose,
    onDelete,
    onFocusTrack,
    onOpenLink,
}) {
    const actionAlert = alert ?? {message, messageIcon}

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
                        <AlarmAlertMessageContent
                            message={message}
                            messageIcon={messageIcon}
                            typographySx={{
                                fontSize: 14,
                                m: 0,
                            }}
                        />
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
                    <Box
                        sx={{
                            flexShrink: 0,
                            alignSelf: 'center',
                        }}
                    >
                        <AlarmAlertActionButtons
                            alert={actionAlert}
                            onFocusTrack={onFocusTrack}
                            onOpenLink={onOpenLink}
                            onDelete={onDelete}
                        />
                    </Box>
                </Stack>
            </Box>
        </Modal>
    )
}
