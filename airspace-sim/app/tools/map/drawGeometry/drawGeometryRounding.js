const NM_OFFSET_PARAM_KEYS = [
    'halfWidthNm',
    'halfHeightNm',
    'halfSizeNm',
    'radiusNm',
]

export function roundGeometryDrawOffsetNm(value) {
    if (!Number.isFinite(value)) {
        return 0
    }

    return Math.round(value)
}

export function roundGeometryManualOffsetNm(value) {
    if (!Number.isFinite(value)) {
        return 0
    }

    return Math.round(value * 100) / 100
}

function roundGeometryParams(params, roundOffset) {
    if (!params) {
        return params
    }

    const nextParams = {...params}

    for (const key of NM_OFFSET_PARAM_KEYS) {
        if (Object.prototype.hasOwnProperty.call(nextParams, key)) {
            nextParams[key] = roundOffset(nextParams[key])
        }
    }

    return nextParams
}

export function roundDrawGeometryParams(params) {
    return roundGeometryParams(params, roundGeometryDrawOffsetNm)
}

export function roundManualGeometryParams(params) {
    return roundGeometryParams(params, roundGeometryManualOffsetNm)
}
