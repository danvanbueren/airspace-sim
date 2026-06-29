'use client'

import {useCallback} from 'react'
import {
    Box,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import PositionReferenceEditor from '@/app/components/floating/windows/PositionReferenceEditor'
import {getDrawShapeIconComponent} from '@/app/components/floating/actionPanels/DrawShapeIcons'
import {useDrawGeometry} from '@/app/contexts/DrawGeometryContext'
import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'
import {
    DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE,
    GEOMETRY_DRAWING_INSTRUCTIONS,
    GEOMETRY_SHAPE_TYPE_LABELS,
    GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM,
} from '@/app/tools/map/drawGeometry/drawGeometryTypes'
import {geometryWindowShouldShowPendingPill} from '@/app/hooks/map/useGeometryWindows'

const NM_FIELD_CONFIG = createDeferredNumericFieldConfig({min: 0})

const GEOMETRY_WINDOW_MONOSPACE_SX = {
    fontFamily: 'monospace',
    '& .MuiTypography-root': {fontFamily: 'monospace'},
    '& .MuiInputBase-root': {fontFamily: 'monospace'},
    '& .MuiInputLabel-root': {fontFamily: 'monospace'},
    '& .MuiFormHelperText-root': {fontFamily: 'monospace'},
    '& .MuiSelect-select': {fontFamily: 'monospace'},
}

function DeferredNmField({label, value, onCommit}) {
    return (
        <DeferredTextField
            label={label}
            committedValue={value ?? 0}
            onCommit={onCommit}
            size='small'
            fullWidth
            type='text'
            inputMode='decimal'
            {...NM_FIELD_CONFIG}
        />
    )
}

function PolygonVertexList({vertices, onChangeVertex, onAddVertex, onRemoveVertex, onMoveVertex}) {
    return (
        <Stack spacing={1}>
            {vertices.map((vertex, index) => (
                <Box
                    key={`vertex-${index}`}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                    }}
                >
                    <Stack direction='row' spacing={0.5} sx={{alignItems: 'center', mb: 1}}>
                        <Typography variant='caption' color='text.secondary'>
                            Vertex {index + 1}
                        </Typography>
                        <Box sx={{flex: 1}}/>
                        <IconButton
                            size='small'
                            aria-label={`Move vertex ${index + 1} up`}
                            disabled={index === 0}
                            onClick={() => onMoveVertex(index, index - 1)}
                        >
                            <ArrowUpwardIcon fontSize='inherit'/>
                        </IconButton>
                        <IconButton
                            size='small'
                            aria-label={`Move vertex ${index + 1} down`}
                            disabled={index >= vertices.length - 1}
                            onClick={() => onMoveVertex(index, index + 1)}
                        >
                            <ArrowDownwardIcon fontSize='inherit'/>
                        </IconButton>
                        <IconButton
                            size='small'
                            aria-label={`Remove vertex ${index + 1}`}
                            disabled={vertices.length <= 2}
                            onClick={() => onRemoveVertex(index)}
                        >
                            <DeleteOutlinedIcon fontSize='inherit'/>
                        </IconButton>
                    </Stack>
                    <PositionReferenceEditor
                        lat={vertex.lat}
                        lng={vertex.lng}
                        compact
                        onCommit={(coords) => onChangeVertex(index, coords)}
                    />
                </Box>
            ))}
            <IconButton
                size='small'
                aria-label='Add vertex'
                onClick={onAddVertex}
                sx={{alignSelf: 'flex-start'}}
            >
                <AddIcon fontSize='small'/>
            </IconButton>
        </Stack>
    )
}

function GeometryCoordinateFields({shape, onUpdateParams}) {
    const {params, type} = shape

    const updateCenter = useCallback((coords) => {
        onUpdateParams({center: coords})
    }, [onUpdateParams])

    switch (type) {
        case 'rectangle':
            return (
                <Stack spacing={1.5}>
                    <PositionReferenceEditor
                        lat={params.center?.lat ?? 0}
                        lng={params.center?.lng ?? 0}
                        onCommit={updateCenter}
                    />
                    <DeferredNmField
                        label='Horizontal offset (NM)'
                        value={params.halfWidthNm}
                        onCommit={(value) => onUpdateParams({halfWidthNm: value})}
                    />
                    <DeferredNmField
                        label='Vertical offset (NM)'
                        value={params.halfHeightNm}
                        onCommit={(value) => onUpdateParams({halfHeightNm: value})}
                    />
                </Stack>
            )
        case 'square':
            return (
                <Stack spacing={1.5}>
                    <PositionReferenceEditor
                        lat={params.center?.lat ?? 0}
                        lng={params.center?.lng ?? 0}
                        onCommit={updateCenter}
                    />
                    <DeferredNmField
                        label='Offset (NM)'
                        value={params.halfSizeNm}
                        onCommit={(value) => onUpdateParams({halfSizeNm: value})}
                    />
                </Stack>
            )
        case 'circle':
            return (
                <Stack spacing={1.5}>
                    <PositionReferenceEditor
                        lat={params.center?.lat ?? 0}
                        lng={params.center?.lng ?? 0}
                        onCommit={updateCenter}
                    />
                    <DeferredNmField
                        label='Radius (NM)'
                        value={params.radiusNm}
                        onCommit={(value) => onUpdateParams({radiusNm: value})}
                    />
                </Stack>
            )
        case 'oval':
            return (
                <Stack spacing={1.5}>
                    <PositionReferenceEditor
                        lat={params.center?.lat ?? 0}
                        lng={params.center?.lng ?? 0}
                        onCommit={updateCenter}
                    />
                    <DeferredNmField
                        label='Horizontal offset (NM)'
                        value={params.halfWidthNm}
                        onCommit={(value) => onUpdateParams({halfWidthNm: value})}
                    />
                    <DeferredNmField
                        label='Vertical offset (NM)'
                        value={params.halfHeightNm}
                        onCommit={(value) => onUpdateParams({halfHeightNm: value})}
                    />
                </Stack>
            )
        case 'racetrack':
            return (
                <Stack spacing={1.5}>
                    <Typography variant='caption' color='text.secondary'>Circle 1 origin</Typography>
                    <PositionReferenceEditor
                        lat={params.center1?.lat ?? 0}
                        lng={params.center1?.lng ?? 0}
                        onCommit={(coords) => onUpdateParams({center1: coords})}
                    />
                    <Typography variant='caption' color='text.secondary'>Circle 2 origin</Typography>
                    <PositionReferenceEditor
                        lat={params.center2?.lat ?? 0}
                        lng={params.center2?.lng ?? 0}
                        onCommit={(coords) => onUpdateParams({center2: coords})}
                    />
                    <DeferredNmField
                        label='Radius (NM)'
                        value={params.radiusNm}
                        onCommit={(value) => onUpdateParams({radiusNm: value})}
                    />
                </Stack>
            )
        case 'polygon':
            return (
                <Stack spacing={1}>
                    <FormControl size='small' fullWidth>
                        <InputLabel id={`geometry-closed-label-${shape.id}`}>Shape mode</InputLabel>
                        <Select
                            labelId={`geometry-closed-label-${shape.id}`}
                            label='Shape mode'
                            value={params.closed ? 'closed' : 'open'}
                            onChange={(event) => onUpdateParams({
                                closed: event.target.value === 'closed',
                                finalized: true,
                            })}
                        >
                            <MenuItem value='open'>Open (polyline)</MenuItem>
                            <MenuItem value='closed'>Closed (polygon)</MenuItem>
                        </Select>
                    </FormControl>
                    <PolygonVertexList
                        vertices={params.vertices ?? []}
                        onChangeVertex={(index, coords) => {
                            const vertices = [...(params.vertices ?? [])]
                            vertices[index] = coords
                            onUpdateParams({vertices, finalized: true})
                        }}
                        onAddVertex={() => {
                            const vertices = [...(params.vertices ?? [])]
                            const lastVertex = vertices[vertices.length - 1] ?? {lat: 0, lng: 0}

                            vertices.push({...lastVertex})
                            onUpdateParams({vertices, finalized: true})
                        }}
                        onRemoveVertex={(index) => {
                            const vertices = (params.vertices ?? []).filter((_, vertexIndex) => (
                                vertexIndex !== index
                            ))

                            onUpdateParams({vertices, finalized: true})
                        }}
                        onMoveVertex={(fromIndex, toIndex) => {
                            const vertices = [...(params.vertices ?? [])]
                            const [moved] = vertices.splice(fromIndex, 1)

                            vertices.splice(toIndex, 0, moved)
                            onUpdateParams({vertices, finalized: true})
                        }}
                    />
                </Stack>
            )
        default:
            return null
    }
}

export default function GeometryWindowBody({shape}) {
    const {
        updateShape,
        changeShapeType,
        drawToolItemIds,
    } = useDrawGeometry()

    const handleNameCommit = useCallback((name) => {
        updateShape(shape.id, {name})
    }, [shape.id, updateShape])

    const handleTypeChange = useCallback((drawToolItemId) => {
        changeShapeType(shape.id, drawToolItemId)
    }, [changeShapeType, shape.id])

    const handleParamsUpdate = useCallback((paramsUpdate) => {
        updateShape(shape.id, {params: paramsUpdate})
    }, [shape.id, updateShape])

    const showPending = geometryWindowShouldShowPendingPill(shape)

    return (
        <Stack spacing={1.5} sx={GEOMETRY_WINDOW_MONOSPACE_SX}>
            <Stack direction='row' spacing={1} sx={{alignItems: 'center'}}>
                <Typography variant='subtitle2' sx={{fontWeight: 'bold', flex: 1}}>
                    Geometry
                </Typography>
                {showPending ? (
                    <Chip label='Pending' size='small' color='warning' variant='outlined'/>
                ) : null}
            </Stack>

            <DeferredTextField
                label='Name (optional)'
                committedValue={shape.name ?? ''}
                onCommit={handleNameCommit}
                size='small'
                fullWidth
                formatCommitted={(value) => value ?? ''}
                getDraftError={() => null}
                parseDraft={(raw) => ({ok: true, value: String(raw ?? '').trim()})}
            />

            <FormControl size='small' fullWidth>
                <InputLabel id={`geometry-type-label-${shape.id}`}>Shape type</InputLabel>
                <Select
                    labelId={`geometry-type-label-${shape.id}`}
                    label='Shape type'
                    value={GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM[shape.type] ?? ''}
                    onChange={(event) => handleTypeChange(event.target.value)}
                >
                    {drawToolItemIds.map((itemId) => {
                        const IconComponent = getDrawShapeIconComponent(itemId)

                        return (
                            <MenuItem key={itemId} value={itemId}>
                                <Stack direction='row' spacing={1} sx={{alignItems: 'center'}}>
                                    {IconComponent ? <IconComponent/> : null}
                                    <span>{GEOMETRY_SHAPE_TYPE_LABELS[DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE[itemId]]}</span>
                                </Stack>
                            </MenuItem>
                        )
                    })}
                </Select>
            </FormControl>

            <Typography variant='caption' color='text.secondary'>
                {GEOMETRY_DRAWING_INSTRUCTIONS[shape.type]}
            </Typography>

            <GeometryCoordinateFields shape={shape} onUpdateParams={handleParamsUpdate}/>
        </Stack>
    )
}
