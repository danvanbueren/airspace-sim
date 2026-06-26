import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import MemoryIcon from '@mui/icons-material/Memory'
import PaletteIcon from '@mui/icons-material/Palette'
import TuneIcon from '@mui/icons-material/Tune'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import InfoIcon from '@mui/icons-material/Info'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsModal from './modal/SettingsModal'
import SettingsToolbelt from './toolbelt/SettingsToolbelt'
import {useState} from 'react'
import {useColorMode} from '@/app/contexts/CustomThemeContext'
import {DEFAULT_SETTINGS_PAGE_ID, SETTINGS_PAGE_IDS, SETTINGS_PAGE_TITLES} from './settingsPageConfig'

const SETTINGS_PAGE_ICONS = {
    lookAndFeel: PaletteIcon,
    simulation: MemoryIcon,
    alerts: NotificationsActiveIcon,
    keybinds: KeyboardIcon,
    advanced: TuneIcon,
    roadmap: HistoryEduIcon,
    about: InfoIcon,
}

export default function SettingsController({modalOpen, setModalOpen}) {

    const [modalState, setModalState] = useState(DEFAULT_SETTINGS_PAGE_ID)

    const [toolbeltOpen, setToolbeltOpen] = useState(false)

    const colorMode = useColorMode()

    const openModalWithState = (state) => {
        setModalState(state)
        setModalOpen(true)
        setToolbeltOpen(false)
    }

    const buildData = {
        oneClick: [{
            name: 'theme',
            icon: colorMode.mode === 'dark' ? <LightModeIcon/> : <DarkModeIcon/>,
            tooltip: 'Toggle theme',
            onToolbeltClick: () => colorMode.toggleColorMode(),
            onModalClick: () => colorMode.toggleColorMode()
        }],
        full: SETTINGS_PAGE_IDS.map((pageId) => {
            const Icon = SETTINGS_PAGE_ICONS[pageId]

            return {
                name: pageId,
                icon: <Icon/>,
                tooltip: SETTINGS_PAGE_TITLES[pageId],
                onToolbeltClick: () => openModalWithState(pageId),
                onModalClick: () => setModalState(pageId),
            }
        }),
    }

    return (<>
        <SettingsModal
            open={modalOpen}
            setOpen={setModalOpen}
            state={modalState}
            buildData={buildData}
            onOpenSettingsPage={setModalState}
        />
        <SettingsToolbelt
            toolbeltOpen={toolbeltOpen}
            setToolbeltOpen={setToolbeltOpen}
            buildData={buildData}
        />
    </>)
}
