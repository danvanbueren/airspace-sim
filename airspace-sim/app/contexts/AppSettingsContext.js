'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'

export const APP_SETTINGS_COOKIE_NAME = 'appSettings'

export const GRID_REFERENCE_SYSTEMS = {
    mgrs: {
        value: 'mgrs',
        label: 'MGRS',
        description: 'Military Grid Reference System',
    },
    geohash: {
        value: 'geohash',
        label: 'Geohash',
        description: 'Geohash',
    },
    gars: {
        value: 'gars',
        label: 'GARS',
        description: 'Global Area Reference System',
    },
    georef: {
        value: 'georef',
        label: 'Georef',
        description: 'World Geographic Reference System',
    },
    geocoords: {
        value: 'geocoords',
        label: 'GeoCoords',
        description: 'Universal Coordinate Parsing',
    },
    dms: {
        value: 'dms',
        label: 'DMS',
        description: 'Degrees, Minutes, Seconds',
    },
    dd: {
        value: 'dd',
        label: 'DD',
        description: 'Decimal Degrees',
    },
    ddm: {
        value: 'ddm',
        label: 'DDM',
        description: 'Degrees and Decimal Minutes',
    },
}

export const DEFAULT_APP_SETTINGS = {
    gridReferenceSystem: GRID_REFERENCE_SYSTEMS.dd.value,
}

function normalizeSettings(settings) {
    const gridReferenceSystem = GRID_REFERENCE_SYSTEMS[settings?.gridReferenceSystem]
        ? settings.gridReferenceSystem
        : DEFAULT_APP_SETTINGS.gridReferenceSystem

    return {
        ...DEFAULT_APP_SETTINGS,
        ...settings,
        gridReferenceSystem,
    }
}

function parseInitialSettings(initialSettings) {
    if (!initialSettings) return DEFAULT_APP_SETTINGS

    if (typeof initialSettings === 'object') {
        return normalizeSettings(initialSettings)
    }

    try {
        return normalizeSettings(JSON.parse(decodeURIComponent(initialSettings)))
    } catch {
        return DEFAULT_APP_SETTINGS
    }
}

function writeAppSettingsCookie(settings) {
    document.cookie = `${APP_SETTINGS_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}; path=/; max-age=31536000; sameSite=lax`
}

const AppSettingsContext = createContext(null)

export function AppSettingsProvider({children, initialSettings}) {
    const [appSettings, setAppSettings] = useState(() => parseInitialSettings(initialSettings))

    const updateAppSettings = useCallback((updater) => {
        setAppSettings((currentSettings) => {
            const nextSettings = typeof updater === 'function' ? updater(currentSettings) : updater
            const normalizedSettings = normalizeSettings(nextSettings)

            writeAppSettingsCookie(normalizedSettings)

            return normalizedSettings
        })
    }, [])

    const setGridReferenceSystem = useCallback((gridReferenceSystem) => {
        updateAppSettings((currentSettings) => ({
            ...currentSettings,
            gridReferenceSystem,
        }))
    }, [updateAppSettings])

    const resetAppSettings = useCallback(() => {
        writeAppSettingsCookie(DEFAULT_APP_SETTINGS)
        setAppSettings(DEFAULT_APP_SETTINGS)
    }, [])

    const value = useMemo(() => ({
        appSettings,
        updateAppSettings,
        setGridReferenceSystem,
        resetAppSettings,
    }), [appSettings, updateAppSettings, setGridReferenceSystem, resetAppSettings])

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    )
}

export function useAppSettings() {
    const context = useContext(AppSettingsContext)

    if (!context) {
        throw new Error('useAppSettings must be used inside AppSettingsProvider')
    }

    return context
}