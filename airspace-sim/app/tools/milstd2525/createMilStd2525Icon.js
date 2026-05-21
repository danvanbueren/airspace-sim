'use client'

import ms from 'milsymbol'

export function createMilStd2525Canvas(symbolCode, options = {}) {
    const symbol = new ms.Symbol(symbolCode, {
        size: options.size ?? 40,
        uniqueDesignation: options.label,
        direction: options.heading,
        speed: options.speed,
        altitudeDepth: options.altitude,
        infoFields: options.infoFields ?? false,
        ...options.symbolOptions,
    })

    return symbol.asCanvas()
}

export async function createMilStd2525ImageBitmap(symbolCode, options = {}) {
    const canvas = createMilStd2525Canvas(symbolCode, options)
    return createImageBitmap(canvas)
}

export async function addMilStd2525IconToMap(map, iconId, symbolCode, options = {}) {
    if (!map || map.hasImage(iconId)) {
        return
    }

    const imageBitmap = await createMilStd2525ImageBitmap(symbolCode, options)

    if (!map.hasImage(iconId)) {
        map.addImage(iconId, imageBitmap)
    }
}