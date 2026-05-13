'use client'

import BasicGlassPanel from './BasicGlassPanel'
import {Box, Button, IconButton, List, ListItem, ListItemText} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

export default function AlarmAlertPanel({queue, setQueue}) {

    const deleteQueueItem = (indexToDelete) => {
        setQueue((currentQueue) => currentQueue.filter((_, index) => index !== indexToDelete))
    }

    if (queue.length < 1)
        return null

    return (
        <BasicGlassPanel dense>
            <Button
                size='small'
                color='warning'
                sx={{fontFamily: 'monospace', fontSize: 12, paddingX: 1}}
                onClick={() => setQueue([])}
            >
                Clear All
            </Button>
            <Box sx={{minWidth: '20rem', maxWidth: '20rem', maxHeight: '10rem', display: 'flex', flexDirection: 'column-reverse', overflowY: 'auto'}}>
                <List dense disablePadding>
                    {queue.map((item, index) => (
                        <ListItem
                            key={`${item[0]}-${index}`}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    size="small"
                                    aria-label="delete alarm"
                                    onClick={() => deleteQueueItem(index)}
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
