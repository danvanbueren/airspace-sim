import {
    GRID_REFERENCE_SYSTEMS,
} from '@/app/contexts/AppSettingsContext'
import {
    formatDdCoordinate,
    formatDdmCoordinate,
    formatDmsCoordinate
} from '@/app/tools/formatting/PrettyLatLong'

export function getGridReferenceSystemDisplayName(gridReferenceSystem) {
    const system = GRID_REFERENCE_SYSTEMS[gridReferenceSystem] ?? GRID_REFERENCE_SYSTEMS.dd

    return system.label
}

export function formatCoordinatePairForGridReferenceSystem(lat, lng, gridReferenceSystem) {
    switch (gridReferenceSystem) {

        case GRID_REFERENCE_SYSTEMS.dms.value:
            return [
                `LAT: ${formatDmsCoordinate(lat, 'N', 'S')}`,
                `LNG: ${formatDmsCoordinate(lng, 'E', 'W')}`,
            ]

        case GRID_REFERENCE_SYSTEMS.ddm.value:
            return [
                `LAT: ${formatDdmCoordinate(lat)}`,
                `LNG: ${formatDdmCoordinate(lng)}`,
            ]

        case GRID_REFERENCE_SYSTEMS.dd.value:
            return [
                `LAT: ${formatDdCoordinate(lat)}`,
                `LNG: ${formatDdCoordinate(lng)}`,
            ]

        case GRID_REFERENCE_SYSTEMS.mgrs.value:
        case GRID_REFERENCE_SYSTEMS.geohash.value:
        case GRID_REFERENCE_SYSTEMS.gars.value:
        case GRID_REFERENCE_SYSTEMS.georef.value:
        case GRID_REFERENCE_SYSTEMS.geocoords.value:
        default:
            return [
                `${getGridReferenceSystemDisplayName(gridReferenceSystem)} formatting pending`,
                `LAT: ${formatDdCoordinate(lat)}`,
                `LNG: ${formatDdCoordinate(lng)}`,
            ]
    }
}