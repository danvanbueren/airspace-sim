import {alpha, Box, Card, Divider, Grid, Modal, Typography} from '@mui/material'
import SettingsModalGenericButton from '@/app/components/panels/settings/modal/SettingsModalGenericButton'

export default function SettingsModal({open, setOpen, state = 'settings', buildData}) {

    const modalStyle = (theme) => ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1000,
        minHeight: '1000',
        height: '60dvh',
        backgroundColor: alpha(theme.palette.background.paper, 0.75),
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        borderRadius: 2,
        boxShadow: 24,
        p: 5,
    })

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
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', height: '100%', paddingRight: 1}}>

                            {buildData.oneClick.map((object, index) => (<SettingsModalGenericButton
                                key={'SettingsModal-OneClick-' + object.name + '-' + index}
                                icon={object.icon}
                                tooltip={object.tooltip}
                                onClick={object.onModalClick}
                            />))}

                            <Divider/>

                            {buildData.full.map((object, index) => (<SettingsModalGenericButton
                                key={'SettingsModal-Full-' + object.name + '-' + index}
                                icon={object.icon}
                                tooltip={object.tooltip}
                                onClick={object.onModalClick}
                                selected={object.name === state}
                            />))}

                        </Box>
                    </Box>
                </Grid>

                <Grid size='auto'>
                    <Divider orientation='vertical'/>
                </Grid>

                <Grid size='grow' sx={{borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <Typography variant='h4' sx={{fontWeight: 'bold', marginBottom: 2}}>
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                    </Typography>
                    <Box sx={{overflow: 'auto', height: '100%', paddingRight: 1}}>
                        <Card sx={{borderRadius: 2, padding: 3, minHeight: '100%'}}>
                            <Typography variant='h1'>todo...</Typography>
                        </Card>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    </Modal>)
}