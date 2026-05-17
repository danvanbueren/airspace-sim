'use client'

import BasicGlassPanel from './BasicGlassPanel'
import {Box, Button, Divider, Grid, IconButton, Stack, Typography} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import {useMapState} from '@/app/contexts/MapStateContext'
import {formatDateTimeGroup} from '@/app/tools/formatting/DateTime'

export default function AlarmAlertPanel() {
    const {alarmAlertQueue, deleteAlarmAlert, clearAlarmAlerts} = useMapState()

    if (alarmAlertQueue.length < 1)
        return null

    return (
        <BasicGlassPanel dense>
            <Button
                size='small'
                color='warning'
                variant='outlined'
                onClick={clearAlarmAlerts}
                sx={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    px: 1,
                    my: 0.5,
                }}

            >
                Clear All
            </Button>
            <Box
                sx={{
                    width: '20rem',
                    maxHeight: '10rem',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    overflowY: 'auto'
                }}
            >
                <Stack
                    direction='column'
                    spacing={1}
                    sx={{
                        p: 1,
                        width: '100%'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            opacity: 0.5,
                            alignSelf: 'center'
                        }}
                    >
                        END OF ALERTS
                    </Typography>

                    {alarmAlertQueue.map((item, index) => (
                        <Box
                            key={`${item[0]}-${index}`}
                        >
                            <Divider
                                sx={{m: 1, mt: 0,}}
                            />
                            <Grid container
                                  sx={{
                                      borderRadius: 1,
                                      px: 1,
                                      '&:hover': {
                                          color: 'info.contrastText',
                                          backgroundColor: 'info.main',
                                      },
                                  }}
                            >
                                <Grid size='grow'>
                                    <Box sx={{pt: 1}}>
                                        <Typography
                                            sx={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {item[1]}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                fontFamily: 'monospace',
                                                fontSize: 14,
                                                py: 1,
                                                opacity: 0.5,
                                            }}
                                        >
                                            {formatDateTimeGroup(item[0])}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid
                                    size='auto'
                                    sx={{
                                        alignContent: 'center',
                                    }}
                                >
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        aria-label="delete alarm"
                                        onClick={() => deleteAlarmAlert(index)}
                                    >
                                        <DeleteIcon fontSize="small"/>
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Stack>
            </Box>
        </BasicGlassPanel>
    )
}
