'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
    parseCookieJsonValue,
    readCookieValue,
    writeCookieJsonValue,
} from '@/app/tools/browser/CookieStorage'
import {
    DEFAULT_SIMULATION_SETTINGS,
    QUALITY_PRESET_CUSTOM,
    QUALITY_PRESET_TUNING_KEYS,
    SELECTABLE_QUALITY_PRESET_OPTIONS,
    qualityPresetMatchesSettings,
    resolveQualityPresetAfterManualTuning,
} from '@/app/simulation/constants'
import {
    ALERT_SIGNAL_IDS,
    ATTENTION_SIGNAL_IDS,
} from '@/app/simulation/signalDefinitions'

export const APP_SETTINGS_COOKIE_NAME = 'appSettings'

export const GRID_REFERENCE_SYSTEMS = {
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
    dms: {
        value: 'dms',
        label: 'DMS',
        description: 'Degrees, Minutes, Seconds',
    },
    gars: {
        value: 'gars',
        label: 'GARS',
        description: 'Global Area Reference System',
    },
    geohash: {
        value: 'geohash',
        label: 'Geohash',
        description: 'Geohash encoding',
    },
    georef: {
        value: 'georef',
        label: 'Georef',
        description: 'World Geographic Reference System',
    },
    killbox: {
        value: 'killbox',
        label: 'Killbox',
        description: 'GARS-based Killbox Reference',
    },
    mgrs: {
        value: 'mgrs',
        label: 'MGRS',
        description: 'Military Grid Reference System',
    },
}

export const QUALITY_PRESET_OPTIONS = SELECTABLE_QUALITY_PRESET_OPTIONS

export {QUALITY_PRESET_CUSTOM} from '@/app/simulation/constants'

export const DEFAULT_APP_SETTINGS = {
    gridReferenceSystem: GRID_REFERENCE_SYSTEMS.dd.value,
    inhibitedAttentions: [],
    inhibitedAlerts: [],
    showPerformanceOverlay: false,
    ...DEFAULT_SIMULATION_SETTINGS,
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value)

    if (!Number.isFinite(number)) {
        return fallback
    }

    return Math.min(max, Math.max(min, number))
}

function normalizeInhibitedSignalIds(values, allowedIds) {
    if (!Array.isArray(values)) {
        return []
    }

    const allowed = new Set(allowedIds)

    return [...new Set(values.filter((value) => typeof value === 'string' && allowed.has(value)))]
}

function normalizeSettings(settings) {
    const gridReferenceSystem = GRID_REFERENCE_SYSTEMS[settings?.gridReferenceSystem]
        ? settings.gridReferenceSystem
        : DEFAULT_APP_SETTINGS.gridReferenceSystem

    const trackUpdateHz = clampNumber(settings?.trackUpdateHz, 2, 30, DEFAULT_APP_SETTINGS.trackUpdateHz)
    const maxActiveFlights = clampNumber(
        settings?.maxActiveFlights ?? settings?.maxTruthAircraftInViewport,
        10,
        2500,
        DEFAULT_APP_SETTINGS.maxActiveFlights,
    )

    const storedPreset = settings?.qualityPreset
    let qualityPreset = DEFAULT_APP_SETTINGS.qualityPreset

    if (storedPreset === QUALITY_PRESET_CUSTOM) {
        qualityPreset = QUALITY_PRESET_CUSTOM
    } else if (SELECTABLE_QUALITY_PRESET_OPTIONS.includes(storedPreset)) {
        qualityPreset = storedPreset
    }

    if (
        qualityPreset !== QUALITY_PRESET_CUSTOM
        && SELECTABLE_QUALITY_PRESET_OPTIONS.includes(qualityPreset)
        && !qualityPresetMatchesSettings(qualityPreset, {trackUpdateHz, maxActiveFlights})
    ) {
        qualityPreset = QUALITY_PRESET_CUSTOM
    }

    return {
        ...DEFAULT_APP_SETTINGS,
        ...settings,
        gridReferenceSystem,
        radarRefreshMs: clampNumber(settings?.radarRefreshMs, 500, 30000, DEFAULT_APP_SETTINGS.radarRefreshMs),
        iffRefreshMs: clampNumber(settings?.iffRefreshMs, 250, 10000, DEFAULT_APP_SETTINGS.iffRefreshMs),
        trackUpdateHz,
        correlationThresholdNm: clampNumber(
            settings?.correlationThresholdNm,
            0.5,
            50,
            DEFAULT_APP_SETTINGS.correlationThresholdNm,
        ),
        maxActiveFlights,
        plotAssociationThresholdNm: clampNumber(
            settings?.plotAssociationThresholdNm,
            0.5,
            20,
            DEFAULT_APP_SETTINGS.plotAssociationThresholdNm,
        ),
        viewportPaddingDegrees: clampNumber(
            settings?.viewportPaddingDegrees,
            0.1,
            5,
            DEFAULT_APP_SETTINGS.viewportPaddingDegrees,
        ),
        qualityPreset,
        adaptivePerformanceEnabled: settings?.adaptivePerformanceEnabled !== false,
        simulationEnabled: settings?.simulationEnabled !== false,
        showPerformanceOverlay: settings?.showPerformanceOverlay === true,
        inhibitedAttentions: normalizeInhibitedSignalIds(
            settings?.inhibitedAttentions,
            ATTENTION_SIGNAL_IDS,
        ),
        inhibitedAlerts: normalizeInhibitedSignalIds(
            settings?.inhibitedAlerts,
            ALERT_SIGNAL_IDS,
        ),
    }
}

function parseInitialSettings(initialSettings) {
    return normalizeSettings(parseCookieJsonValue(initialSettings, DEFAULT_APP_SETTINGS))
}

function readBrowserSettings() {
    return normalizeSettings(parseCookieJsonValue(
        readCookieValue(APP_SETTINGS_COOKIE_NAME),
        DEFAULT_APP_SETTINGS
    ))
}

const AppSettingsContext = createContext(null)

function writeAppSettingsCookie(settings) {
    writeCookieJsonValue(APP_SETTINGS_COOKIE_NAME, settings)
}

export function AppSettingsProvider({children, initialSettings}) {
    const [appSettings, setAppSettings] = useState(() => parseInitialSettings(initialSettings))

    useEffect(() => {
        const browserSettings = readBrowserSettings()

        setAppSettings((currentSettings) => {
            const currentJson = JSON.stringify(currentSettings)
            const browserJson = JSON.stringify(browserSettings)

            return currentJson === browserJson ? currentSettings : browserSettings
        })
    }, [])

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

    const updateSimulationSettings = useCallback((updates) => {
        updateAppSettings((currentSettings) => {
            const nextSettings = {
                ...currentSettings,
                ...updates,
            }
            const explicitlySelectedPreset = (
                typeof updates.qualityPreset === 'string'
                && updates.qualityPreset !== QUALITY_PRESET_CUSTOM
                && SELECTABLE_QUALITY_PRESET_OPTIONS.includes(updates.qualityPreset)
            )
            const qualityPreset = (
                explicitlySelectedPreset
                || !QUALITY_PRESET_TUNING_KEYS.some((key) => key in updates)
            )
                ? nextSettings.qualityPreset
                : resolveQualityPresetAfterManualTuning(currentSettings, updates)

            return {
                ...nextSettings,
                qualityPreset,
            }
        })
    }, [updateAppSettings])

    const simulationSettings = useMemo(() => ({
        radarRefreshMs: appSettings.radarRefreshMs,
        iffRefreshMs: appSettings.iffRefreshMs,
        trackUpdateHz: appSettings.trackUpdateHz,
        correlationThresholdNm: appSettings.correlationThresholdNm,
        qualityPreset: appSettings.qualityPreset,
        adaptivePerformanceEnabled: appSettings.adaptivePerformanceEnabled,
        simulationEnabled: appSettings.simulationEnabled,
        maxActiveFlights: appSettings.maxActiveFlights,
        maxTruthAircraftInViewport: appSettings.maxActiveFlights,
        plotAssociationThresholdNm: appSettings.plotAssociationThresholdNm,
        viewportPaddingDegrees: appSettings.viewportPaddingDegrees,
    }), [appSettings])

    const value = useMemo(() => ({
        appSettings,
        simulationSettings,
        updateAppSettings,
        updateSimulationSettings,
        setGridReferenceSystem,
        resetAppSettings,
    }), [
        appSettings,
        simulationSettings,
        updateAppSettings,
        updateSimulationSettings,
        setGridReferenceSystem,
        resetAppSettings,
    ])

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