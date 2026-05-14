'use client'

import BasicGlassPanel from './BasicGlassPanel'
import {Box, Button, IconButton, List, ListItem, ListItemText} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import {useAlarmAlert} from '@/app/contexts/AlarmAlertContext'

export default function AlarmAlertPanel() {
    const {alarmAlertQueue, deleteAlarmAlert, clearAlarmAlerts} = useAlarmAlert()

    if (alarmAlertQueue.length < 1)
        return null

    return (
        <BasicGlassPanel dense>
            <Button
                size='small'
                color='warning'
                sx={{fontFamily: 'monospace', fontSize: 12, paddingX: 1}}
                onClick={clearAlarmAlerts}
            >
                Clear All
            </Button>
            <Box sx={{minWidth: '20rem', maxWidth: '20rem', maxHeight: '10rem', display: 'flex', flexDirection: 'column-reverse', overflowY: 'auto'}}>
                <List dense disablePadding>
                    {alarmAlertQueue.map((item, index) => (
                        <ListItem
                            key={`${item[0]}-${index}`}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    size="small"
                                    aria-label="delete alarm"
                                    onClick={() => deleteAlarmAlert(index)}
                                >
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            }
                            sx={{
                                px: 1,
                                py: 0.25,
                                pr: 5,
                            }}
                        >
                            <ListItemText
                                primary={item[1]}
                                secondary={
                                    item[0].toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                        timeZone: 'UTC',
                                    }).replace(',', '').replace(/^(\d{2}) (\w{3}) (\d{2})/, '$1-$2-$3').replace(/:/g, '') + 'Z'
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </BasicGlassPanel>
    )
}
