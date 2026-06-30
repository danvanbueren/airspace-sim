/**
 * A lightweight uniform grid spatial index to partition objects with
 * 2D longitude and latitude coordinates into grid cells.
 * This changes spatial proximity queries from O(N) to O(1) average time complexity.
 */
export class UniformGridIndex {
    /**
     * @param {number} cellSizeDegrees - The width/height of each cell in degrees.
     */
    constructor(cellSizeDegrees = 1.0) {
        this.cellSize = cellSizeDegrees
        this.grid = new Map()
    }

    /**
     * @param {number} lng
     * @param {number} lat
     * @returns {string} Unique string key for the cell coordinates.
     */
    getCellKey(lng, lat) {
        const x = Math.floor(lng / this.cellSize)
        const y = Math.floor(lat / this.cellSize)
        return `${x},${y}`
    }

    /**
     * Clear the index.
     */
    clear() {
        this.grid.clear()
    }

    /**
     * Insert an object into the index.
     * @param {{ id: string, longitude: number, latitude: number }} item
     */
    insert(item) {
        if (!item || !Number.isFinite(item.longitude) || !Number.isFinite(item.latitude)) {
            return
        }

        const key = this.getCellKey(item.longitude, item.latitude)
        let cell = this.grid.get(key)
        if (!cell) {
            cell = []
            this.grid.set(key, cell)
        }
        cell.push(item)
    }

    /**
     * Insert multiple objects.
     * @param {Array<Object>} items
     */
    insertAll(items) {
        if (!Array.isArray(items)) {
            return
        }
        for (let i = 0; i < items.length; i++) {
            this.insert(items[i])
        }
    }

    /**
     * Query candidate items that fall within a search bounding box matching the given radius.
     * @param {number} lng - Query longitude.
     * @param {number} lat - Query latitude.
     * @param {number} radiusNm - Proximity search radius in nautical miles.
     * @returns {Array<Object>} List of candidate objects.
     */
    query(lng, lat, radiusNm) {
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(radiusNm) || radiusNm <= 0) {
            return []
        }

        // 1 degree of latitude is exactly 60 nautical miles.
        const latRadiusDegrees = radiusNm / 60

        // 1 degree of longitude is 60 * cos(latitude) nautical miles.
        // Clamp latitude to [-85, 85] to avoid extreme/infinite values near poles.
        const clampedLat = Math.max(-85, Math.min(85, lat))
        const cosLat = Math.cos(clampedLat * Math.PI / 180)
        const lngRadiusDegrees = cosLat > 0.01 ? (radiusNm / (60 * cosLat)) : 360

        const minLng = lng - lngRadiusDegrees
        const maxLng = lng + lngRadiusDegrees
        const minLat = lat - latRadiusDegrees
        const maxLat = lat + latRadiusDegrees

        const minX = Math.floor(minLng / this.cellSize)
        const maxX = Math.floor(maxLng / this.cellSize)
        const minY = Math.floor(minLat / this.cellSize)
        const maxY = Math.floor(maxLat / this.cellSize)

        // Safety caps to avoid huge loops in edge cases.
        const limitX = Math.min(maxX - minX + 1, 360)
        const limitY = Math.min(maxY - minY + 1, 180)

        const results = []

        for (let dx = 0; dx < limitX; dx++) {
            const x = minX + dx
            for (let dy = 0; dy < limitY; dy++) {
                const y = minY + dy
                const cell = this.grid.get(`${x},${y}`)
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        results.push(cell[i])
                    }
                }
            }
        }

        return results
    }
}
