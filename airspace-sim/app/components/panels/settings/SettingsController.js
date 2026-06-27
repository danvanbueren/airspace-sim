import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsModal from './modal/SettingsModal'
import SettingsToolbelt from './toolbelt/SettingsToolbelt'
import {useEffect, useMemo, useState} from 'react'
import {useColorMode} from '@/app/contexts/CustomThemeContext'
import {
    DEFAULT_SETTINGS_PAGE_ID,
    SETTINGS_NAV_SECTIONS,
    SETTINGS_PAGE_ICONS,
    SETTINGS_PAGE_TITLES,
} from './settingsPageConfig'

function buildPageNavItem(pageId, {onToolbeltClick, onModalClick}) {
    const Icon = SETTINGS_PAGE_ICONS[pageId]

    return {
        name: pageId,
        icon: <Icon/>,
        tooltip: SETTINGS_PAGE_TITLES[pageId],
        onToolbeltClick,
        onModalClick,
    }
}

export default function SettingsController({modalOpen, setModalOpen, initialPageId = null}) {
    const [modalState, setModalState] = useState(DEFAULT_SETTINGS_PAGE_ID)
    const [toolbeltOpen, setToolbeltOpen] = useState(false)
    const colorMode = useColorMode()

    useEffect(() => {
        if (initialPageId) {
            setModalState(initialPageId)
        }
    }, [initialPageId])

    const openModalWithState = (state) => {
        setModalState(state)
        setModalOpen(true)
        setToolbeltOpen(false)
    }

    const buildData = useMemo(() => {
        const pageActions = Object.fromEntries(
            SETTINGS_NAV_SECTIONS
                .filter((section) => section.type === 'pages')
                .flatMap((section) => section.pageIds)
                .map((pageId) => [
                    pageId,
                    {
                        onToolbeltClick: () => openModalWithState(pageId),
                        onModalClick: () => setModalState(pageId),
                    },
                ]),
        )

        return {
            oneClick: [{
                name: 'theme',
                icon: colorMode.mode === 'dark' ? <LightModeIcon/> : <DarkModeIcon/>,
                tooltip: 'Toggle theme',
                onToolbeltClick: () => colorMode.toggleColorMode(),
                onModalClick: () => colorMode.toggleColorMode(),
            }],
            sections: SETTINGS_NAV_SECTIONS.map((section) => {
                if (section.type === 'divider') {
                    return section
                }

                return {
                    type: 'pages',
                    modalHeading: section.modalHeading,
                    items: section.pageIds.map((pageId) => buildPageNavItem(pageId, pageActions[pageId])),
                }
            }),
        }
    }, [colorMode])

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
