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
import {maintainFleetEmergencySquawks, formatMode3Code} from './iffMode3'
import {updateAircraftKinematics} from './flightWorldKinematics'
import {UniformGridIndex} from './UniformGridIndex.js'

export class FlightWorldSimulator {
    constructor() {
        this.airports = loadAirportCatalog()
        this.routes = loadAirRouteCatalog()
        this.airportByIcao = buildAirportIndex(this.airports)
        this.generalAviationAirports = getGeneralAviationAirports(this.airports)
        this.pickRoute = buildWeightedRoutePicker(this.routes, this.airportByIcao, this.airports)
        this.aircraft = new Map()
        this.nextFlightIndex = 0
        this.nextGeneralAviationIndex = 0
        this.initialized = false
        this.maxActiveFlights = 0
        this.lastReassignedAircraft = []
        this.spatialIndex = null
        this.spatialIndexBuilt = false
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
            
            let route = null
            let aircraft = null
            let attempts = 0
            
            while (attempts < 10) {
                route = this.pickRoute(random)
                aircraft = createFlightAircraft(id, route, this.airportByIcao, random)
                
                const isTooClose = Array.from(nextAircraft.values()).some((other) => {
                    return other.routeId === route.id
                        && Math.abs((other.progressNm ?? 0) - aircraft.progressNm) < 30
                })
                if (!isTooClose) {
                    break
                }
                attempts++
            }

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
        maintainFleetEmergencySquawks(this.aircraft, random)
        this.spatialIndexBuilt = false
    }

    initialize(maxActiveFlights) {
        if (this.initialized) {
            return
        }

        const random = createBootstrapRandom(maxActiveFlights)
        this.maxActiveFlights = maxActiveFlights
        this.rebalanceFleet(maxActiveFlights, random)
        this.initialized = true
    }

    setMaxActiveFlights(maxActiveFlights) {
        if (this.initialized && maxActiveFlights === this.maxActiveFlights) {
            return
        }

        const random = createBootstrapRandom(maxActiveFlights)

        if (!this.initialized) {
            this.initialize(maxActiveFlights)
            return
        }

        this.maxActiveFlights = maxActiveFlights
        this.rebalanceFleet(maxActiveFlights, random)
    }

    advance(deltaSeconds) {
        if (deltaSeconds <= 0) {
            return
        }

        if (!this.runningRandom) {
            this.runningRandom = createBootstrapRandom('flight-world-simulator-running-' + Math.random())
        }
        const random = this.runningRandom
        const repositionedIds = []

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
                current = assignNewRoute(current, this.pickRoute, this.airportByIcao, random, Array.from(this.aircraft.values()))
                progressNm = Math.min(distanceNm, current.totalRouteNm * 0.05)
                repositionedIds.push(id)
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

        this.lastReassignedAircraft = repositionedIds.map((aircraftId) => {
            const aircraft = this.aircraft.get(aircraftId)

            return {
                id: aircraft.id,
                longitude: aircraft.longitude,
                latitude: aircraft.latitude,
                heading: aircraft.heading,
                speed: aircraft.speed,
                altitude: aircraft.altitude,
            }
        })
        this.spatialIndexBuilt = false
    }

    getAircraftById(aircraftId) {
        return this.aircraft.get(aircraftId) ?? null
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

    ensureSpatialIndex() {
        if (this.spatialIndexBuilt && this.spatialIndex) {
            return
        }

        const index = new UniformGridIndex(1.0)
        index.insertAll(this.getAllAircraft())
        this.spatialIndex = index
        this.spatialIndexBuilt = true
    }

    findNearestAircraft(longitude, latitude, maxDistanceNm = 15) {
        this.ensureSpatialIndex()

        let best = null
        let bestDistance = Infinity

        const candidates = this.spatialIndex.query(longitude, latitude, maxDistanceNm)

        for (let i = 0; i < candidates.length; i++) {
            const aircraft = candidates[i]
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
        }

        return best
    }

    findAircraftByMode3Code(mode3Code, maxDistanceNm = 15, longitude, latitude) {
        const normalized = formatMode3Code(mode3Code)

        if (!normalized) {
            return null
        }

        this.ensureSpatialIndex()

        let best = null
        let bestDistance = Infinity

        const candidates = this.spatialIndex.query(longitude, latitude, maxDistanceNm)

        for (let i = 0; i < candidates.length; i++) {
            const aircraft = candidates[i]
            if (formatMode3Code(aircraft.mode3Code) !== normalized) {
                continue
            }

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
        }

        return best
    }

    dispose() {
        this.aircraft.clear()
        this.spatialIndex?.clear()
        this.spatialIndexBuilt = false
        this.initialized = false
    }
}

export function createFlightWorldSimulator() {
    return new FlightWorldSimulator()
}
