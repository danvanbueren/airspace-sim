import {alpha} from '@mui/material/styles'

export const GLASS_PANEL_BORDER_STYLE = {
    borderWidth: 2,
    borderRadius: '2%',
}

export function getGlassPanelSurfaceSx(theme) {
    return {
        backgroundColor: alpha(theme.palette.background.paper, 0.3),
        backdropFilter: 'blur(10px)',
    }
}
