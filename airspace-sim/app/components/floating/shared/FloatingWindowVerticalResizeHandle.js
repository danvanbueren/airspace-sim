'use client'

import {Box} from '@mui/material'

function ResizeIndicator() {
    return (
        <Box
            aria-hidden
            sx={{
                width: 10,
                height: 10,
                opacity: 0.7,
                backgroundImage: [
                    'linear-gradient(135deg, transparent 0 40%, rgba(158,158,158,0.95) 40% 45%, transparent 45% 55%, rgba(158,158,158,0.95) 55% 60%, transparent 60%)',
                    'linear-gradient(135deg, transparent 0 55%, rgba(158,158,158,0.95) 55% 60%, transparent 60%)',
                ].join(', '),
            }}
        />
    )
}

export default function FloatingWindowVerticalResizeHandle({
    interactionsEnabled = true,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}) {
    return (
        <Box
            aria-label='Resize window height'
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            sx={{
                position: 'absolute',
                right: 4,
                bottom: 4,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                width: 20,
                height: 20,
                cursor: interactionsEnabled ? 'ns-resize' : 'default',
                touchAction: 'none',
            }}
        >
            <ResizeIndicator/>
        </Box>
    )
}
