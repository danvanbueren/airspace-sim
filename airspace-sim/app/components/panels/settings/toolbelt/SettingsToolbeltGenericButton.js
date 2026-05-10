'use client'

import { Fab, Tooltip } from '@mui/material'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

export default function SettingsToolbeltGenericButton({icon = <QuestionMarkIcon/>, tooltip = 'Unknown', onClick = null}) {

    return (
        <Tooltip
            title={ tooltip }
            placement='left'
        >
            <Fab
                onClick={ onClick }
                color='inherit'
                size='small'
                sx={{
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        color: 'primary.contrastText',
                        backgroundColor: 'primary.main',
                    },
            }}
            >
                { icon }
            </Fab>
        </Tooltip>
    )
}
