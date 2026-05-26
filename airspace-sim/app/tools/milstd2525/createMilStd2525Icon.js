'use client'

import ms from 'milsymbol'

const FALLBACK_SYMBOL_CODE = '10011000000000000000'

function isRenderableSymbol(symbol) {
    const validation = symbol.isValid(true)

    return validation === true || Boolean(validation?.drawInstructions)
}

function createSymbol(symbolCode, options) {
    const symbolOptions = {
        fill: false,
        size: options.size ?? 20,
        uniqueDesignation: options.label,
        direction: options.heading,
        speed: options.speed,
        altitudeDepth: options.altitude,
        civilianColor: options.civilianColor,
        infoFields: options.infoFields ?? false,
        standard: '2525',
        ...options.symbolOptions,
    }
    const symbol = new ms.Symbol(symbolCode, symbolOptions)

    if (isRenderableSymbol(symbol)) {
        return symbol
    }

    return new ms.Symbol(FALLBACK_SYMBOL_CODE, symbolOptions)
}

export function createMilStd2525Canvas(symbolCode, options = {}) {
    const symbol = createSymbol(symbolCode, options)

    return symbol.asCanvas()
}

export async function createMilStd2525ImageBitmap(symbolCode, options = {}) {
    const canvas = createMilStd2525Canvas(symbolCode, options)

    if (typeof createImageBitmap !== 'function') {
        return canvas
    }

    return createImageBitmap(canvas)
}

export async function addMilStd2525IconToMap(map, iconId, symbolCode, options = {}) {
    if (!map || map.hasImage(iconId)) return true

    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
        return false
    }

    const imageBitmap = await createMilStd2525ImageBitmap(symbolCode, options)

    if (!map.hasImage(iconId)) {
        map.addImage(iconId, imageBitmap)
    }

    return true
}