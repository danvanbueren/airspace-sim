'use client'

import {Box} from '@mui/material'
import {getSignalLabel} from '@/app/simulation/signalDefinitions'
import {ATTENTION_AMBER} from '@/app/tools/map/trackAttentionDisplay'

export default function AttentionFlagPills({flagIds, dense = false}) {
    if (!flagIds?.length) {
        return null
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: dense ? 0.5 : 0.75,
            }}
        >
            {flagIds.map((flagId) => (
                <Box
                    key={flagId}
                    component='span'
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: dense ? 0.75 : 1,
                        py: dense ? 0.125 : 0.25,
                        borderRadius: 999,
                        border: `1px solid ${ATTENTION_AMBER}`,
                        color: ATTENTION_AMBER,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        fontSize: dense ? '0.7rem' : '0.75rem',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {getSignalLabel(flagId)}
                </Box>
            ))}
        </Box>
    )
}
