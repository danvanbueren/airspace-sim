const FIELD_ALTITUDE_FT = 1500
const CLIMB_PHASE_END = 0.12
const DESCENT_PHASE_START = 0.88
const CRUISE_ALTITUDE_VARIATION_FT = 400
const CLIMB_SPEED_MIN_KTS = 160
const CLIMB_SPEED_MAX_KTS = 280
const DESCENT_SPEED_MAX_KTS = 300
const DESCENT_SPEED_MIN_KTS = 200
const CRUISE_SPEED_MIN_KTS = 300
const CRUISE_SPEED_MAX_KTS = 520

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

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

export function getKinematicOscillation(aircraft, deltaSeconds) {
    const kinematicPhase = (aircraft.kinematicPhase ?? 0) + deltaSeconds

    return {
        kinematicPhase,
        speedJitter: Math.sin(kinematicPhase * 1.7) * 5 + Math.sin(kinematicPhase * 0.43) * 3,
        headingJitter: Math.sin(kinematicPhase * 0.31) * 4 + Math.sin(kinematicPhase * 0.87) * 2,
    }
}

export function speedAlongRouteProfile(aircraft, speedJitter = 0) {
    const progress = getRouteProgressRatio(aircraft)
    const altitude = altitudeAlongRouteProfile(aircraft)
    const cruiseAltitude = aircraft.cruiseAltitude ?? 35_000
    const fieldAltitude = aircraft.fieldAltitude ?? FIELD_ALTITUDE_FT
    const cruiseSpeed = aircraft.baseSpeed ?? 430
    const speedBias = aircraft.speedBias ?? 0

    if (progress <= CLIMB_PHASE_END) {
        const climbFraction = clamp(
            (altitude - fieldAltitude) / Math.max(1, cruiseAltitude - fieldAltitude),
            0,
            1,
        )
        const base = CLIMB_SPEED_MIN_KTS + (climbFraction * (CLIMB_SPEED_MAX_KTS - CLIMB_SPEED_MIN_KTS))

        return Math.round(clamp(base + speedJitter + speedBias, 140, 310))
    }

    if (progress >= DESCENT_PHASE_START) {
        const descentFraction = (progress - DESCENT_PHASE_START) / (1 - DESCENT_PHASE_START)
        const base = DESCENT_SPEED_MAX_KTS
            - (descentFraction * (DESCENT_SPEED_MAX_KTS - DESCENT_SPEED_MIN_KTS))

        return Math.round(clamp(base + speedJitter + speedBias, 180, 330))
    }

    const altitudeThousands = altitude / 1000
    const base = 200 + (Math.max(0, altitudeThousands - 10) * 6)
    const scaled = Math.min(cruiseSpeed + 15, Math.max(CRUISE_SPEED_MIN_KTS, base))

    return Math.round(clamp(scaled + speedJitter + speedBias, CRUISE_SPEED_MIN_KTS, CRUISE_SPEED_MAX_KTS))
}

export function headingWithJitter(routeHeading, headingJitter = 0) {
    return Math.round(((routeHeading + headingJitter) % 360 + 360) % 360)
}

export function updateAircraftKinematics(aircraft, routeHeading, deltaSeconds) {
    const {kinematicPhase, speedJitter, headingJitter} = getKinematicOscillation(aircraft, deltaSeconds)
    const altitude = Math.round(altitudeAlongRouteProfile(aircraft))

    return {
        altitude,
        speed: speedAlongRouteProfile(aircraft, speedJitter),
        heading: headingWithJitter(routeHeading, headingJitter),
        kinematicPhase,
    }
}
