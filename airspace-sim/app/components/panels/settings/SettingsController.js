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

export default function SettingsController({modalOpen, setModalOpen}) {

    const [modalState, setModalState] = useState('simulation')

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
        full: [{
            name: 'simulation',
            icon: <MemoryIcon/>,
            tooltip: 'Simulation Engine',
            onToolbeltClick: () => openModalWithState('simulation'),
            onModalClick: () => setModalState('simulation')
        }, {
            name: 'lookAndFeel',
            icon: <PaletteIcon/>,
            tooltip: 'Look & Feel',
            onToolbeltClick: () => openModalWithState('lookAndFeel'),
            onModalClick: () => setModalState('lookAndFeel')
        }, {
            name: 'advanced',
            icon: <TuneIcon/>,
            tooltip: 'Advanced',
            onToolbeltClick: () => openModalWithState('advanced'),
            onModalClick: () => setModalState('advanced')
        }, {
            name: 'keybinds',
            icon: <KeyboardIcon/>,
            tooltip: 'Keybinds',
            onToolbeltClick: () => openModalWithState('keybinds'),
            onModalClick: () => setModalState('keybinds')
        }, {
            name: 'alerts',
            icon: <NotificationsActiveIcon/>,
            tooltip: 'Alerts & Attentions',
            onToolbeltClick: () => openModalWithState('alerts'),
            onModalClick: () => setModalState('alerts')
        }, {
            name: 'roadmap',
            icon: <HistoryEduIcon/>,
            tooltip: 'Roadmap',
            onToolbeltClick: () => openModalWithState('roadmap'),
            onModalClick: () => setModalState('roadmap')
        }, {
            name: 'about',
            icon: <InfoIcon/>,
            tooltip: 'About',
            onToolbeltClick: () => openModalWithState('about'),
            onModalClick: () => setModalState('about')
        }]
    }

    return (<>
        <SettingsModal
            open={modalOpen}
            setOpen={setModalOpen}
            state={modalState}
            buildData={buildData}
        />
        <SettingsToolbelt
            toolbeltOpen={toolbeltOpen}
            setToolbeltOpen={setToolbeltOpen}
            buildData={buildData}
        />
    </>)
}