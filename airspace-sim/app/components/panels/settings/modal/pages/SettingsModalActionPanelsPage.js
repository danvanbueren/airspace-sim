'use client'

import {useState} from 'react'
import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteIcon from '@mui/icons-material/Delete'
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    getActionPanelItemDefinition,
    getAvailableAssignableItems,
} from '@/app/actionPanels/actionPanelRegistry'
import {useActionPanels} from '@/app/contexts/ActionPanelsContext'

const DISPLAY_STYLE_OPTIONS = [
    {
        value: ACTION_PANEL_DISPLAY_STYLES.LARGE,
        label: 'Large buttons / toggles',
        description: '80px grid controls matching the default operator layout.',
    },
    {
        value: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
        label: 'Compact list',
        description: 'Switch and mini-button lists for higher density.',
    },
]

function moveItemAtIndex(itemIds, fromIndex, direction) {
    const toIndex = fromIndex + direction

    if (toIndex < 0 || toIndex >= itemIds.length) {
        return itemIds
    }

    const nextItemIds = [...itemIds]
    const [movedItem] = nextItemIds.splice(fromIndex, 1)
    nextItemIds.splice(toIndex, 0, movedItem)

    return nextItemIds
}

function ActionPanelItemRow({
    itemId,
    index,
    itemCount,
    onMoveUp,
    onMoveDown,
    onRemove,
}) {
    const definition = getActionPanelItemDefinition(itemId)

    return (
        <Stack
            direction='row'
            spacing={1}
            sx={{alignItems: 'center'}}
        >
            <Typography
                sx={{
                    flexGrow: 1,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                }}
            >
                {definition?.label ?? itemId}
            </Typography>
            <IconButton
                size='small'
                aria-label='Move item up'
                disabled={index === 0}
                onClick={onMoveUp}
            >
                <ArrowUpwardIcon fontSize='small'/>
            </IconButton>
            <IconButton
                size='small'
                aria-label='Move item down'
                disabled={index === itemCount - 1}
                onClick={onMoveDown}
            >
                <ArrowDownwardIcon fontSize='small'/>
            </IconButton>
            <IconButton
                size='small'
                aria-label='Remove item'
                onClick={onRemove}
            >
                <DeleteIcon fontSize='small'/>
            </IconButton>
        </Stack>
    )
}

function ActionPanelEditor({
    panel,
    onRename,
    onDisplayStyleChange,
    onItemIdsChange,
    onRemovePanel,
    disableRemove,
}) {
    const [pendingItemId, setPendingItemId] = useState('')

    const addItem = (itemId) => {
        if (!itemId) {
            return
        }

        onItemIdsChange([...panel.itemIds, itemId])
        setPendingItemId('')
    }

    const availableItems = getAvailableAssignableItems(panel.itemIds)

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction='row'
                    spacing={1}
                    sx={{alignItems: 'flex-start'}}
                >
                    <DeferredTextField
                        label='Panel title'
                        size='small'
                        fullWidth
                        committedValue={panel.title}
                        onCommit={(nextTitle) => onRename(nextTitle)}
                        parseDraft={(draft) => draft}
                        formatCommitted={(value) => value}
                        getDraftError={(draft) => (
                            draft.trim().length === 0 ? 'Title is required.' : null
                        )}
                    />
                    <IconButton
                        aria-label={`Remove ${panel.title}`}
                        color='error'
                        disabled={disableRemove}
                        onClick={onRemovePanel}
                        sx={{mt: 0.5}}
                    >
                        <DeleteIcon/>
                    </IconButton>
                </Stack>

                <FormControl fullWidth size='small'>
                    <InputLabel id={`action-panel-style-${panel.id}`}>
                        Display style
                    </InputLabel>
                    <Select
                        labelId={`action-panel-style-${panel.id}`}
                        label='Display style'
                        value={panel.displayStyle}
                        onChange={(event) => onDisplayStyleChange(event.target.value)}
                    >
                        {DISPLAY_STYLE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography variant='caption' color='text.secondary'>
                    {DISPLAY_STYLE_OPTIONS.find((option) => option.value === panel.displayStyle)?.description}
                </Typography>

                <Box>
                    <Typography variant='subtitle2' sx={{fontWeight: 'bold', mb: 1}}>
                        Panel items
                    </Typography>

                    <Stack spacing={1}>
                        {panel.itemIds.map((itemId, index) => (
                            <ActionPanelItemRow
                                key={`${panel.id}-${itemId}-${index}`}
                                itemId={itemId}
                                index={index}
                                itemCount={panel.itemIds.length}
                                onMoveUp={() => {
                                    onItemIdsChange(moveItemAtIndex(panel.itemIds, index, -1))
                                }}
                                onMoveDown={() => {
                                    onItemIdsChange(moveItemAtIndex(panel.itemIds, index, 1))
                                }}
                                onRemove={() => {
                                    onItemIdsChange(panel.itemIds.filter((_, itemIndex) => itemIndex !== index))
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                <Stack direction='row' spacing={1}>
                    <FormControl fullWidth size='small'>
                        <InputLabel id={`action-panel-add-item-${panel.id}`}>
                            Add item
                        </InputLabel>
                        <Select
                            labelId={`action-panel-add-item-${panel.id}`}
                            label='Add item'
                            value={pendingItemId}
                            disabled={availableItems.length === 0}
                            onChange={(event) => {
                                addItem(event.target.value)
                            }}
                        >
                            <MenuItem value=''>
                                <em>{availableItems.length === 0 ? 'All actions added' : 'Select an action'}</em>
                            </MenuItem>
                            {availableItems.map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>
        </Box>
    )
}

export default function SettingsModalActionPanelsPage() {
    const {
        actionPanelsState,
        addActionPanel,
        removeActionPanel,
        renameActionPanel,
        setActionPanelDisplayStyle,
        setActionPanelItemIds,
        resetActionPanelsState,
    } = useActionPanels()

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Modular action panels
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Add, remove, and rename draggable glass panels on the map. Assign buttons and
                    sensor-display toggles to each panel, switch between large and compact layouts,
                    and drag or resize panels directly on the map. Changes persist in your browser
                    cookie.
                </Typography>
            </Box>

            <Stack spacing={2}>
                {actionPanelsState.panels.map((panel) => (
                    <ActionPanelEditor
                        key={panel.id}
                        panel={panel}
                        disableRemove={actionPanelsState.panels.length <= 1}
                        onRename={(title) => renameActionPanel(panel.id, title)}
                        onDisplayStyleChange={(displayStyle) => {
                            setActionPanelDisplayStyle(panel.id, displayStyle)
                        }}
                        onItemIdsChange={(itemIds) => setActionPanelItemIds(panel.id, itemIds)}
                        onRemovePanel={() => removeActionPanel(panel.id)}
                    />
                ))}
            </Stack>

            <Button
                variant='outlined'
                startIcon={<AddIcon/>}
                onClick={() => addActionPanel({title: 'New Action Panel'})}
                sx={{alignSelf: 'flex-start'}}
            >
                Add panel
            </Button>

            <SettingsModalPageRestoreFooter
                pageLabel='Reset Action Panels Page'
                pageHint='Restores the default Category Select and Fixed Function panels.'
                onPageReset={resetActionPanelsState}
            />
        </Stack>
    )
}
