import {SENSOR_HISTORY_CYCLE_COUNT} from './constants'

export class SensorHistoryBuffer {
    constructor(capacity = SENSOR_HISTORY_CYCLE_COUNT) {
        this.capacity = capacity
        this.cycles = []
        this.cycleCounter = 0
    }

    push(snapshot) {
        const entry = {
            ...snapshot,
            cycleId: this.cycleCounter,
        }

        this.cycleCounter += 1
        this.cycles.push(entry)

        while (this.cycles.length > this.capacity) {
            this.cycles.shift()
        }

        return entry
    }

    get size() {
        return this.cycles.length
    }

    getLatest() {
        return this.cycles[this.cycles.length - 1] ?? null
    }

    getCycle(index) {
        return this.cycles[index] ?? null
    }

    getOldestIndex() {
        return 0
    }

    getNewestIndex() {
        return this.cycles.length - 1
    }

    getHistoryIndices(excludeNewest = false) {
        if (this.cycles.length === 0) {
            return []
        }

        const lastIndex = this.cycles.length - 1

        if (excludeNewest && lastIndex === 0) {
            return []
        }

        const endIndex = excludeNewest ? lastIndex - 1 : lastIndex

        return Array.from({length: endIndex + 1}, (_, index) => index)
    }

    clear() {
        this.cycles = []
    }
}
