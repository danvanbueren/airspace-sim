import {TRACK_IDENTITIES} from './trackSymbolCodes.js'

const TRACK_IDENTITY_CHROME_BY_MODE = {
    [TRACK_IDENTITIES.PENDING]: {
        dark: {
            headerBackground: '#f5f5f5',
            headerText: '#121212',
            focusOutline: '#f5f5f5',
        },
        light: {
            headerBackground: '#757575',
            headerText: '#ffffff',
            focusOutline: '#616161',
        },
    },
    [TRACK_IDENTITIES.UNKNOWN]: {
        dark: {
            headerBackground: '#ffd24d',
            headerText: '#121212',
            focusOutline: '#ffd24d',
        },
        light: {
            headerBackground: '#ffc107',
            headerText: '#121212',
            focusOutline: '#ffa000',
        },
    },
    [TRACK_IDENTITIES.ASSUMED_FRIENDLY]: {
        dark: {
            headerBackground: '#61d36b',
            headerText: '#0d1f10',
            focusOutline: '#61d36b',
        },
        light: {
            headerBackground: '#43a047',
            headerText: '#ffffff',
            focusOutline: '#2e7d32',
        },
    },
    [TRACK_IDENTITIES.FRIENDLY]: {
        dark: {
            headerBackground: '#2ea7ff',
            headerText: '#07131f',
            focusOutline: '#2ea7ff',
        },
        light: {
            headerBackground: '#1976d2',
            headerText: '#ffffff',
            focusOutline: '#1565c0',
        },
    },
    [TRACK_IDENTITIES.NEUTRAL]: {
        dark: {
            headerBackground: '#61d36b',
            headerText: '#0d1f10',
            focusOutline: '#61d36b',
        },
        light: {
            headerBackground: '#43a047',
            headerText: '#ffffff',
            focusOutline: '#2e7d32',
        },
    },
    [TRACK_IDENTITIES.SUSPECT]: {
        dark: {
            headerBackground: '#ff9a3d',
            headerText: '#1a1208',
            focusOutline: '#ff9a3d',
        },
        light: {
            headerBackground: '#fb8c00',
            headerText: '#1a1208',
            focusOutline: '#ef6c00',
        },
    },
    [TRACK_IDENTITIES.HOSTILE]: {
        dark: {
            headerBackground: '#ff5252',
            headerText: '#1f0808',
            focusOutline: '#ff5252',
        },
        light: {
            headerBackground: '#e53935',
            headerText: '#ffffff',
            focusOutline: '#c62828',
        },
    },
}

export function getTrackIdentityChromeColors(identity, theme) {
    const mode = theme.palette.mode === 'light' ? 'light' : 'dark'
    const palette = TRACK_IDENTITY_CHROME_BY_MODE[identity]
        ?? TRACK_IDENTITY_CHROME_BY_MODE[TRACK_IDENTITIES.UNKNOWN]

    return palette[mode]
}
