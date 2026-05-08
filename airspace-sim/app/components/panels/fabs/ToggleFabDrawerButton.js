'use client'

import { Fab } from "@mui/material"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';

export default function ToggleFabDrawerButton({open, setOpen}) {

    return (
        <Fab
            onClick={() => setOpen(!open)}
            color='inherit'
            sx={{
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        color: 'primary.contrastText',
                        backgroundColor: 'primary.main',
                    },
            }}
        >
            {
                <>
                    <KeyboardArrowDownIcon
                        sx={{
                            position: 'absolute',
                            opacity: open ? 1 : 0,
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'opacity 250ms ease, transform 250ms ease',
                        }}
                    />

                    <MenuIcon
                        sx={{
                            opacity: open ? 0 : 1,
                            transition: 'opacity 250ms ease',
                        }}
                    />
                </>


            }
        </Fab>
    )
}
