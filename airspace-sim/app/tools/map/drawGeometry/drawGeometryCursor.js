const PEN_HOTSPOT_X = 3
const PEN_HOTSPOT_Y = 21

function buildPenCursorSvg(fill, stroke) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="${fill}" stroke="${stroke}" stroke-width="0.75"/></svg>`
}

function encodePenCursor(fill, stroke) {
    const svg = buildPenCursorSvg(fill, stroke)

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${PEN_HOTSPOT_X} ${PEN_HOTSPOT_Y}, crosshair`
}

export function getDrawGeometryCursor(mode = 'dark') {
    if (mode === 'light') {
        return encodePenCursor('#111111', '#ffffff')
    }

    return encodePenCursor('#ffffff', '#111111')
}
