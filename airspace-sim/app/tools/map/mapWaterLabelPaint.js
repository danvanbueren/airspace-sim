const WATER_LABEL_LAYER_IDS = [
    'waterway_label',
    'watername_ocean',
    'watername_sea',
    'watername_lake',
    'watername_lake_line',
]

const DARK_MAP_STYLE_MARKER = 'dark-matter'

const LIGHT_WATER_LABEL_PAINT = {
    'text-color': '#51909c',
    'text-halo-color': '#e2eef0',
}

const DARK_WATER_LABEL_PAINT = {
    'text-color': '#ffffff',
    'text-halo-color': '#000000',
}

export function isDarkMapStyle(styleKey) {
    return String(styleKey ?? '').includes(DARK_MAP_STYLE_MARKER)
}

export function applyWaterLabelPaint(map, styleKey) {
    if (!map || (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded())) {
        return
    }

    const paint = isDarkMapStyle(styleKey) ? DARK_WATER_LABEL_PAINT : LIGHT_WATER_LABEL_PAINT

    for (const layerId of WATER_LABEL_LAYER_IDS) {
        if (!map.getLayer(layerId)) {
            continue
        }

        map.setPaintProperty(layerId, 'text-color', paint['text-color'])
        map.setPaintProperty(layerId, 'text-halo-color', paint['text-halo-color'])
    }
}
