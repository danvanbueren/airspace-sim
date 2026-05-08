'use client'

import {Box} from "@mui/material";
import ToggleThemeButton from "@/app/components/panels/floating/ToggleThemeButton";
import ToggleDrawerHamburgerButton from "@/app/components/panels/floating/ToggleDrawerHamburgerButton";

export default function FloatingPanel() {

    return (
        <Box
            sx={{
                backgroundColor: 'background.paper',
            }}
        >
            <ToggleThemeButton/>
            <ToggleDrawerHamburgerButton/>
        </Box>
    )
}
