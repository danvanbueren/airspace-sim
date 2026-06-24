import {haversineDistanceNm, isPointInBounds} from './geo'
import {
    assignNewRoute,
    buildAirportIndex,
    buildWeightedRoutePicker,
    createBootstrapRandom,
    createFlightAircraft,
    headingAlongRoute,
    loadAirportCatalog,
    loadAirRouteCatalog,
    positionAlongRoute,
} from './flightWorldUtils'
import {updateAircraftKinematics} from './flightWorldKinematics'

export class FlightWorldSimulator {
    constructor() {
        this.airports = loadAirportCatalog()
        this.routes = loadAirRouteCatalog()
        this.airportByIcao = buildAirportIndex(this.airports)
        this.pickRoute = buildWeightedRoutePicker(this.routes, this.airportByIcao)
        this.aircraft = new Map()
        this.nextFlightIndex = 0
        this.initialized = false
    }

    initialize(maxActiveFlights) {
        if (this.initialized) {
            return
        }

        const random = createBootstrapRandom(maxActiveFlights)
        const targetCount = Math.max(0, maxActiveFlights)

        while (this.aircraft.size < targetCount) {
            const id = `FLT-${this.nextFlightIndex}`
            this.nextFlightIndex += 1
            const route = this.pickRoute(random)
            const aircraft = createFlightAircraft(id, route, this.airportByIcao, random)

            this.aircraft.set(id, aircraft)
        }

        this.initialized = true
    }

    setMaxActiveFlights(maxActiveFlights) {
        const random = createBootstrapRandom(maxActiveFlights, Date.now())

        if (!this.initialized) {
            this.initialize(maxActiveFlights)
            return
        }

        while (this.aircraft.size < maxActiveFlights) {
            const id = `FLT-${this.nextFlightIndex}`
            this.nextFlightIndex += 1
            const route = this.pickRoute(random)
            const aircraft = createFlightAircraft(id, route, this.airportByIcao, random)

            this.aircraft.set(id, aircraft)
        }

        if (this.aircraft.size > maxActiveFlights) {
            const keys = Array.from(this.aircraft.keys())
            const excess = this.aircraft.size - maxActiveFlights

            for (let index = keys.length - excess; index < keys.length; index += 1) {
                this.aircraft.delete(keys[index])
            }
        }
    }

    advance(deltaSeconds) {
        if (deltaSeconds <= 0) {
            return
        }

        const random = createBootstrapRandom('advance', Math.floor(Date.now() / 1000))

        this.aircraft.forEach((aircraft, id) => {
            const speed = aircraft.speed ?? 0
            const distanceNm = (speed * deltaSeconds) / 3600
            let progressNm = (aircraft.progressNm ?? 0) + distanceNm
            let current = aircraft

            if (progressNm >= aircraft.totalRouteNm) {
                current = assignNewRoute(aircraft, this.pickRoute, this.airportByIcao, random)
                progressNm = Math.min(distanceNm, current.totalRouteNm * 0.05)
            }

            const position = positionAlongRoute(
                current.polyline,
                current.segmentLengths,
                current.totalRouteNm,
                progressNm,
            )
            const heading = headingAlongRoute(
                current.polyline,
                current.segmentLengths,
                current.totalRouteNm,
                progressNm,
            )
            const kinematics = updateAircraftKinematics(current, deltaSeconds, random)

            this.aircraft.set(id, {
                ...current,
                progressNm,
                longitude: position.lng,
                latitude: position.lat,
                heading,
                ...kinematics,
            })
        })
    }

    getAircraftInBounds(bounds) {
        if (!bounds) {
            return []
        }

        const results = []

        this.aircraft.forEach((aircraft) => {
            if (isPointInBounds(aircraft.longitude, aircraft.latitude, bounds)) {
                results.push(aircraft)
            }
        })

        return results
    }

    getAllAircraft() {
        return Array.from(this.aircraft.values())
    }

    getAirports() {
        return this.airports
    }

    getRoutes() {
        return this.routes
    }

    findNearestAircraft(longitude, latitude, maxDistanceNm = 15) {
        let best = null
        let bestDistance = Infinity

        this.aircraft.forEach((aircraft) => {
            const distance = haversineDistanceNm(
                latitude,
                longitude,
                aircraft.latitude,
                aircraft.longitude,
            )

            if (distance < bestDistance && distance <= maxDistanceNm) {
                bestDistance = distance
                best = aircraft
            }
        })

        return best
    }

    dispose() {
        this.aircraft.clear()
        this.initialized = false
    }
}

export function createFlightWorldSimulator() {
    return new FlightWorldSimulator()
}
