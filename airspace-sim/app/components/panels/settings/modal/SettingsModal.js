'use client'

import {useEffect, useRef} from 'react'
import {alpha, Box, Card, Divider, Grid, Modal, Typography} from '@mui/material'
import SettingsModalGenericButton from '@/app/components/panels/settings/modal/SettingsModalGenericButton'
import SettingsModalSimulationEnginePage from '@/app/components/panels/settings/modal/pages/SettingsModalSimulationEnginePage'
import SettingsModalLookAndFeelPage from './pages/SettingsModalLookAndFeelPage'
import SettingsModalAdvancedPage from './pages/SettingsModalAdvancedPage'
import SettingsModalKeybindsPage from './pages/SettingsModalKeybindsPage'
import SettingsModalRoadmapPage from './pages/SettingsModalRoadmapPage'
import SettingsModalAboutPage from './pages/SettingsModalAboutPage'
import SettingsModalAlertsAttentionsPage from './pages/SettingsModalAlertsAttentionsPage'
import SettingsModalUsageGuidePage from './pages/SettingsModalUsageGuidePage'
import {
    DEFAULT_SETTINGS_PAGE_ID,
    SETTINGS_MODAL_SIDEBAR_HEADINGS,
    SETTINGS_PAGE_TITLES,
} from '../settingsPageConfig'

function SettingsModalSidebarHeading({children}) {
    return (
        <Typography
            variant='caption'
            sx={{
                display: 'block',
                fontWeight: 700,
                color: 'text.secondary',
                px: 0.5,
            }}
        >
            {children}
        </Typography>
    )
}

export default function SettingsModal({open, setOpen, state = DEFAULT_SETTINGS_PAGE_ID, buildData, onOpenSettingsPage}) {
    const pageScrollRef = useRef(null)

    useEffect(() => {
        pageScrollRef.current?.scrollTo({top: 0})
    }, [state])

    const modalStyle = (theme) => ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1000,
        minHeight: 600,
        height: '60dvh',
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        borderRadius: 2,
        boxShadow: 24,
        p: 5,
    })

    const getModalPage = () => {
        switch (state) {
            case 'simulation':
                return <SettingsModalSimulationEnginePage/>
            case 'lookAndFeel':
                return <SettingsModalLookAndFeelPage/>
            case 'advanced':
                return <SettingsModalAdvancedPage/>
            case 'keybinds':
                return <SettingsModalKeybindsPage onOpenSettingsPage={onOpenSettingsPage}/>
            case 'alerts':
                return <SettingsModalAlertsAttentionsPage/>
            case 'roadmap':
                return <SettingsModalRoadmapPage/>
            case 'about':
                return <SettingsModalAboutPage/>
            case 'usageGuide':
                return <SettingsModalUsageGuidePage onOpenSettingsPage={onOpenSettingsPage}/>
            default:
                return 'UNKNOWN MODAL STATE'
        }
    }

    return (<Modal
        open={open}
        onClose={() => setOpen(false)}
    >
        <Box sx={modalStyle}>
            <Grid container style={{gap: '2rem', height: '100%'}}>

                <Grid size='auto' sx={{height: '100%'}}>
                    <Box
                        sx={{
                            display: 'flex', height: '100%', overflow: 'hidden'
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            overflow: 'auto',
                            height: '100%',
                            paddingRight: 1
                        }}>

                            <SettingsModalSidebarHeading>
                                {SETTINGS_MODAL_SIDEBAR_HEADINGS.quickActions}
                            </SettingsModalSidebarHeading>

                            {buildData.oneClick.map((object, index) => (<SettingsModalGenericButton
                                key={'SettingsModal-OneClick-' + object.name + '-' + index}
                                icon={object.icon}
                                tooltip={object.tooltip}
                                onClick={object.onModalClick}
                            />))}

                            {buildData.sections.map((section, sectionIndex) => {
                                if (section.type === 'divider') {
                                    return <Divider key={`SettingsModal-Divider-${sectionIndex}`}/>
                                }

                                return (
                                    <Box
                                        key={`SettingsModal-Section-${sectionIndex}`}
                                        sx={{display: 'flex', flexDirection: 'column', gap: 2}}
                                    >
                                        {section.modalHeading ? (
                                            <SettingsModalSidebarHeading>
                                                {section.modalHeading}
                                            </SettingsModalSidebarHeading>
                                        ) : null}
                                        {section.items.map((object, index) => (
                                            <SettingsModalGenericButton
                                                key={`SettingsModal-Page-${object.name}-${sectionIndex}-${index}`}
                                                icon={object.icon}
                                                tooltip={object.tooltip}
                                                onClick={object.onModalClick}
                                                selected={object.name === state}
                                            />
                                        ))}
                                    </Box>
                                )
                            })}

                        </Box>
                    </Box>
                </Grid>

                <Grid size='auto'>
                    <Divider orientation='vertical'/>
                </Grid>

                <Grid size='grow' sx={{borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <Typography variant='h4' sx={{fontWeight: 'bold', marginBottom: 2}}>
                        {SETTINGS_PAGE_TITLES[state] ?? state}
                    </Typography>
                    <Box ref={pageScrollRef} sx={{overflow: 'auto', height: '100%', paddingRight: 1}}>
                        <Card sx={{borderRadius: 2, padding: 3, minHeight: '100%'}}>
                            {getModalPage()}
                        </Card>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    </Modal>)
}