const FIELD_ALTITUDE_FT = 1500
const CLIMB_PHASE_END = 0.12
const DESCENT_PHASE_START = 0.88
const CRUISE_ALTITUDE_VARIATION_FT = 400
const SPEED_ALTITUDE_FACTOR_PER_1000FT = 2.5
const SPEED_JITTER_MAX_KTS = 6
const MIN_SPEED_KTS = 220
const MAX_SPEED_KTS = 540

export function getRouteProgressRatio(aircraft) {
    if (!aircraft?.totalRouteNm || aircraft.totalRouteNm <= 0) {
        return 0
    }

    return Math.max(0, Math.min(1, (aircraft.progressNm ?? 0) / aircraft.totalRouteNm))
}

export function altitudeAlongRouteProfile(aircraft) {
    const progress = getRouteProgressRatio(aircraft)
    const cruiseAltitude = aircraft.cruiseAltitude ?? aircraft.altitude ?? 30_000
    const fieldAltitude = aircraft.fieldAltitude ?? FIELD_ALTITUDE_FT

    if (progress <= CLIMB_PHASE_END) {
        const fraction = progress / CLIMB_PHASE_END

        return fieldAltitude + ((cruiseAltitude - fieldAltitude) * fraction)
    }

    if (progress >= DESCENT_PHASE_START) {
        const fraction = (progress - DESCENT_PHASE_START) / (1 - DESCENT_PHASE_START)

        return cruiseAltitude - ((cruiseAltitude - fieldAltitude) * fraction)
    }

    const variation = Math.sin(progress * Math.PI * 6) * CRUISE_ALTITUDE_VARIATION_FT

    return cruiseAltitude + variation
}

export function speedForAltitude(baseSpeed, altitude, speedBias = 0, speedJitter = 0) {
    const altitudeBonus = ((altitude - 25_000) / 1000) * SPEED_ALTITUDE_FACTOR_PER_1000FT

    return Math.round(Math.max(
        MIN_SPEED_KTS,
        Math.min(MAX_SPEED_KTS, baseSpeed + altitudeBonus + speedBias + speedJitter),
    ))
}

export function updateAircraftKinematics(aircraft, deltaSeconds, random) {
    const altitude = Math.round(altitudeAlongRouteProfile(aircraft))
    const baseSpeed = aircraft.baseSpeed ?? aircraft.speed ?? 400
    let speedJitter = aircraft.speedJitter ?? 0

    if (random() < Math.min(1, deltaSeconds * 0.2)) {
        speedJitter = (random() - 0.5) * SPEED_JITTER_MAX_KTS * 2
    }

    const speedBias = aircraft.speedBias ?? 0

    return {
        altitude,
        speed: speedForAltitude(baseSpeed, altitude, speedBias, speedJitter),
        speedJitter,
    }
}
