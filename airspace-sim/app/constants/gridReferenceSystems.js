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

export const DEFAULT_GRID_REFERENCE_SYSTEM = GRID_REFERENCE_SYSTEMS.killbox.value
