import {alpha} from '@mui/material/styles'

export const FLOATING_PANEL_BORDER_STYLE = {
    borderWidth: 2,
    borderRadius: '2%',
}

export function getFloatingPanelSurfaceSx(theme) {
    return {
        backgroundColor: alpha(theme.palette.background.paper, 0.3),
        backdropFilter: 'blur(10px)',
    }
}
