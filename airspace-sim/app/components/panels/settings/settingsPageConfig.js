import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import InfoIcon from '@mui/icons-material/Info'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import MemoryIcon from '@mui/icons-material/Memory'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PaletteIcon from '@mui/icons-material/Palette'
import TuneIcon from '@mui/icons-material/Tune'

export const SETTINGS_PAGE_IDS = [
    'lookAndFeel',
    'keybinds',
    'alerts',
    'simulation',
    'advanced',
    'usageGuide',
    'roadmap',
    'about',
]

export const SETTINGS_PAGE_TITLES = {
    lookAndFeel: 'Look & Feel',
    keybinds: 'Keybinds',
    alerts: 'Alerts & Attentions',
    simulation: 'Simulation Engine',
    advanced: 'Advanced',
    usageGuide: 'Usage Guide',
    roadmap: 'Roadmap',
    about: 'About',
}

export const SETTINGS_PAGE_ICONS = {
    lookAndFeel: PaletteIcon,
    keybinds: KeyboardIcon,
    alerts: NotificationsActiveIcon,
    simulation: MemoryIcon,
    advanced: TuneIcon,
    usageGuide: MenuBookIcon,
    roadmap: HistoryEduIcon,
    about: InfoIcon,
}

export const SETTINGS_NAV_SECTIONS = [
    {type: 'divider'},
    {type: 'pages', pageIds: ['lookAndFeel', 'keybinds', 'alerts']},
    {type: 'divider'},
    {type: 'pages', pageIds: ['simulation', 'advanced']},
    {type: 'divider'},
    {type: 'pages', pageIds: ['usageGuide', 'roadmap', 'about']},
]

export const DEFAULT_SETTINGS_PAGE_ID = SETTINGS_PAGE_IDS[0]
