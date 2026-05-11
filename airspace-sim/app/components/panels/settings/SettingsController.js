import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import InfoIcon from '@mui/icons-material/Info'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsModal from './modal/SettingsModal'
import SettingsToolbelt from './toolbelt/SettingsToolbelt'
import {useState} from 'react'
import {useColorMode} from '../../global/CustomThemeProvider'

export default function SettingsController({modalOpen, setModalOpen}) {

    const [modalState, setModalState] = useState('settings')

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
            name: 'settings',
            icon: <SettingsIcon/>,
            tooltip: 'Settings',
            onToolbeltClick: () => openModalWithState('settings'),
            onModalClick: () => setModalState('settings')
        }, {
            name: 'keybinds',
            icon: <KeyboardIcon/>,
            tooltip: 'Keybinds',
            onToolbeltClick: () => openModalWithState('keybinds'),
            onModalClick: () => setModalState('keybinds')
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