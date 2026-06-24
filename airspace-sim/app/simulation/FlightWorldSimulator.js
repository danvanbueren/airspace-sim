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
import {
    advanceGeneralAviationAircraft,
    createGeneralAviationAircraft,
    getGeneralAviationAirports,
    getGeneralAviationFleetSize,
    pickGeneralAviationAirport,
} from './generalAviationTraffic'
import {updateAircraftKinematics} from './flightWorldKinematics'

export class FlightWorldSimulator {
    constructor() {
        this.airports = loadAirportCatalog()
        this.routes = loadAirRouteCatalog()
        this.airportByIcao = buildAirportIndex(this.airports)
        this.generalAviationAirports = getGeneralAviationAirports(this.airports)
        this.pickRoute = buildWeightedRoutePicker(this.routes, this.airportByIcao)
        this.aircraft = new Map()
        this.nextFlightIndex = 0
        this.nextGeneralAviationIndex = 0
        this.initialized = false
    }

    getCommercialFleetTarget(maxActiveFlights) {
        const gaTarget = getGeneralAviationFleetSize(maxActiveFlights)

        return Math.max(0, maxActiveFlights - gaTarget)
    }

    rebalanceFleet(maxActiveFlights, random) {
        const gaTarget = getGeneralAviationFleetSize(maxActiveFlights)
        const commercialTarget = this.getCommercialFleetTarget(maxActiveFlights)
        const existingCommercial = Array.from(this.aircraft.values())
            .filter((aircraft) => aircraft.trafficKind !== 'generalAviation')
        const existingGa = Array.from(this.aircraft.values())
            .filter((aircraft) => aircraft.trafficKind === 'generalAviation')
        const nextAircraft = new Map()

        existingCommercial.slice(0, commercialTarget).forEach((aircraft) => {
            nextAircraft.set(aircraft.id, aircraft)
        })

        existingGa.slice(0, gaTarget).forEach((aircraft) => {
            nextAircraft.set(aircraft.id, aircraft)
        })

        let commercialCount = existingCommercial.slice(0, commercialTarget).length
        let gaCount = existingGa.slice(0, gaTarget).length

        while (commercialCount < commercialTarget) {
            const id = `FLT-${this.nextFlightIndex}`
            this.nextFlightIndex += 1
            const route = this.pickRoute(random)
            const aircraft = createFlightAircraft(id, route, this.airportByIcao, random)

            nextAircraft.set(id, aircraft)
            commercialCount += 1
        }

        while (gaCount < gaTarget) {
            const airport = pickGeneralAviationAirport(this.generalAviationAirports, random)

            if (!airport) {
                break
            }

            const id = `GA-${this.nextGeneralAviationIndex}`
            this.nextGeneralAviationIndex += 1
            const aircraft = createGeneralAviationAircraft(id, airport, random)

            nextAircraft.set(id, aircraft)
            gaCount += 1
        }

        this.aircraft = nextAircraft
    }

    initialize(maxActiveFlights) {
        if (this.initialized) {
            return
        }

        const random = createBootstrapRandom(maxActiveFlights)
        this.rebalanceFleet(maxActiveFlights, random)
        this.initialized = true
    }

    setMaxActiveFlights(maxActiveFlights) {
        const random = createBootstrapRandom(maxActiveFlights, Date.now())

        if (!this.initialized) {
            this.initialize(maxActiveFlights)
            return
        }

        this.rebalanceFleet(maxActiveFlights, random)
    }

    advance(deltaSeconds) {
        if (deltaSeconds <= 0) {
            return
        }

        const random = createBootstrapRandom('advance', Math.floor(Date.now() / 1000))

        this.aircraft.forEach((aircraft, id) => {
            if (aircraft.trafficKind === 'generalAviation') {
                this.aircraft.set(id, advanceGeneralAviationAircraft(aircraft, deltaSeconds))
                return
            }

            let current = aircraft
            const routeHeading = headingAlongRoute(
                current.polyline,
                current.segmentLengths,
                current.totalRouteNm,
                current.progressNm ?? 0,
            )
            const kinematics = updateAircraftKinematics(current, routeHeading, deltaSeconds)
            const speed = kinematics.speed ?? 0
            const distanceNm = (speed * deltaSeconds) / 3600
            let progressNm = (current.progressNm ?? 0) + distanceNm

            if (progressNm >= current.totalRouteNm) {
                current = assignNewRoute(current, this.pickRoute, this.airportByIcao, random)
                progressNm = Math.min(distanceNm, current.totalRouteNm * 0.05)
            }

            const position = positionAlongRoute(
                current.polyline,
                current.segmentLengths,
                current.totalRouteNm,
                progressNm,
            )
            const nextRouteHeading = headingAlongRoute(
                current.polyline,
                current.segmentLengths,
                current.totalRouteNm,
                progressNm,
            )
            const nextKinematics = updateAircraftKinematics(
                {...current, progressNm},
                nextRouteHeading,
                deltaSeconds,
            )

            this.aircraft.set(id, {
                ...current,
                progressNm,
                longitude: position.lng,
                latitude: position.lat,
                routeHeading: nextRouteHeading,
                ...nextKinematics,
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
