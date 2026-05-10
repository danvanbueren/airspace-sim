'use client'

import {Button} from '@mui/material'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'

export default function SettingsModalGenericButton({
                                                       icon = <QuestionMarkIcon/>,
                                                       tooltip = 'Unknown',
                                                       onClick = null,
                                                       selected = false
                                                   }) {

    return (<Button
        onClick={selected ? null : onClick}
        variant={selected ? 'contained' : 'outlined'}
        size='large'
        startIcon={icon}
        sx={{
            justifyContent: 'flex-start'
        }}
    >
        {tooltip}
    </Button>)
}
