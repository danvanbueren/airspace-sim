'use client'

import {Button, Grid} from '@mui/material'
import BasicGlassPanel from './BasicGlassPanel'
import {useAlarmAlertActions} from '@/app/hooks/global/useAlarmAlertActions'

export default function FixedFunctionPanel() {

    const {raiseAlarmAlert, zoomIn, zoomOut} = useAlarmAlertActions()

    return (
        <BasicGlassPanel title='Fixed Function Panel'>

            <Grid
                container
                spacing={2}
                style={{width: '100%'}}
            >
                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        onClick={zoomIn}
                    >
                        ZOOM IN
                    </Button>
                </Grid>

                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        onClick={zoomOut}
                    >
                        ZOOM OUT
                    </Button>
                </Grid>

                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        onClick={() => {
                            raiseAlarmAlert({
                                signalId: 'UI_HOME',
                                message: 'HOME action is not yet implemented.',
                            })
                        }}
                    >
                        HOME
                    </Button>
                </Grid>

                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        onClick={() => {
                            raiseAlarmAlert({
                                signalId: 'UI_CENTER_E3',
                                message: 'CENTER ON E-3 action is not yet implemented.',
                            })
                        }}
                    >
                        CENTER ON E-3
                    </Button>
                </Grid>

                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        disabled
                    >
                        -
                    </Button>
                </Grid>

                <Grid
                    size={4}
                >
                    <Button
                        variant='outlined'
                        color='inherit'
                        sx={{
                            height: 80,
                            display: 'block',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            borderColor: 'grey.800',
                            '&:hover': {
                                borderColor: 'grey.400',
                            }
                        }}
                        disabled
                    >
                        -
                    </Button>
                </Grid>
            </Grid>

        </BasicGlassPanel>
    )
}
