import {
    HISTORY_PLAYBACK_NEWEST_DWELL_MS,
    HISTORY_PLAYBACK_STEP_MS,
    SENSOR_DISPLAY_TOGGLES,
} from './constants'

function getHistoryToggleForSensor(sensorType) {
    return sensorType === 'radar'
        ? SENSOR_DISPLAY_TOGGLES.RADAR_HISTORY
        : SENSOR_DISPLAY_TOGGLES.IFF_HISTORY
}

function getCurrentToggleForSensor(sensorType) {
    return sensorType === 'radar'
        ? SENSOR_DISPLAY_TOGGLES.RADAR_CURRENT
        : SENSOR_DISPLAY_TOGGLES.IFF_CURRENT
}

export class HistoryPlaybackController {
    constructor({onStep, onStop}) {
        this.onStep = onStep
        this.onStop = onStop
        this.timers = new Map()
        this.activeIndices = new Map()
    }

    isHistoryEnabled(sensorType, activeToggles) {
        return activeToggles.includes(getHistoryToggleForSensor(sensorType))
    }

    isCurrentEnabled(sensorType, activeToggles) {
        return activeToggles.includes(getCurrentToggleForSensor(sensorType))
    }

    getPlaybackIndices(buffer, sensorType, activeToggles) {
        if (buffer.size === 0) {
            return []
        }

        const excludeNewest = this.isCurrentEnabled(sensorType, activeToggles)
        const indices = buffer.getHistoryIndices(excludeNewest)

        if (indices.length === 0 && buffer.size > 0 && !excludeNewest) {
            return [buffer.getNewestIndex()]
        }

        return indices
    }

    stop(sensorType) {
        const timer = this.timers.get(sensorType)

        if (timer) {
            clearTimeout(timer)
            this.timers.delete(sensorType)
        }

        this.activeIndices.delete(sensorType)
        this.onStop?.(sensorType)
    }

    stopAll() {
        for (const sensorType of [...this.timers.keys()]) {
            this.stop(sensorType)
        }
    }

    sync(sensorType, buffer, activeToggles) {
        this.stop(sensorType)

        if (!this.isHistoryEnabled(sensorType, activeToggles)) {
            return
        }

        const indices = this.getPlaybackIndices(buffer, sensorType, activeToggles)

        if (indices.length === 0) {
            return
        }

        this.activeIndices.set(sensorType, 0)
        this.scheduleStep(sensorType, buffer, indices, activeToggles)
    }

    scheduleStep(sensorType, buffer, indices, activeToggles) {
        const stepIndex = this.activeIndices.get(sensorType) ?? 0
        const cycleIndex = indices[stepIndex]

        this.onStep?.(sensorType, cycleIndex, buffer.getCycle(cycleIndex))

        const isNewestInPlayback = stepIndex === indices.length - 1
        const delayMs = isNewestInPlayback
            ? HISTORY_PLAYBACK_NEWEST_DWELL_MS
            : HISTORY_PLAYBACK_STEP_MS

        const timer = setTimeout(() => {
            this.timers.delete(sensorType)

            if (!this.isHistoryEnabled(sensorType, activeToggles)) {
                this.stop(sensorType)
                return
            }

            const nextIndices = this.getPlaybackIndices(buffer, sensorType, activeToggles)

            if (nextIndices.length === 0) {
                this.stop(sensorType)
                return
            }

            const nextStep = (stepIndex + 1) % nextIndices.length
            this.activeIndices.set(sensorType, nextStep)
            this.scheduleStep(sensorType, buffer, nextIndices, activeToggles)
        }, delayMs)

        this.timers.set(sensorType, timer)
    }

    dispose() {
        this.stopAll()
    }
}
