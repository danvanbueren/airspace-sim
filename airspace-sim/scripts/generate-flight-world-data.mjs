#!/usr/bin/env node
/**
 * Generates app/data/airports.json and app/data/airRoutes.json from OurAirports
 * open data (https://ourairports.com/data/). Run from airspace-sim/:
 *
 *   node scripts/generate-flight-world-data.mjs
 */

import {createHash} from 'node:crypto'
import {createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {pipeline} from 'node:stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'app', 'data')
const CACHE_DIR = join(__dirname, 'data-cache')

const OURAIRPORTS_BASE = 'https://davidmegginson.github.io/ourairports-data'
const MIN_RUNWAY_FT = 500
const GRID_CELL_DEG = 2

const MILITARY_NAME_PATTERN = /\b(air force|airforce|afb|air base|airbase|naval air|army air|military base|military airfield|mcas|nas |jafb|raaf|raf |usaf|nato air|luftwaffe|armee de l.?air|armée de l.?air|plaaf|iaf base|paf base|air station)\b/i

// Trunk-route limits keep airRoutes.json small enough to ship in the app bundle.
// Regional strips and local hops are generated procedurally at runtime.
const NEIGHBOR_LIMITS = {
    major: {major: 8, strip: 0, military: 2},
    strip: {major: 0, strip: 0, military: 0},
    military: {major: 2, strip: 0, military: 4},
}

const ROUTE_WEIGHT_BY_PAIR = {
    'major-major': 10,
    'major-strip': 4,
    'major-military': 5,
    'strip-strip': 2,
    'strip-military': 3,
    'military-military': 6,
}

const MILITARY_PROFILES = ['fighter', 'tanker', 'transport']

function parseCsv(text) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index]
        const next = text[index + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                field += '"'
                index += 1
            } else if (char === '"') {
                inQuotes = false
            } else {
                field += char
            }
            continue
        }

        if (char === '"') {
            inQuotes = true
            continue
        }

        if (char === ',') {
            row.push(field)
            field = ''
            continue
        }

        if (char === '\n') {
            row.push(field)
            rows.push(row)
            row = []
            field = ''
            continue
        }

        if (char === '\r') {
            continue
        }

        field += char
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    const [header, ...body] = rows

    return body.map((values) => Object.fromEntries(header.map((key, columnIndex) => [
        key,
        values[columnIndex] ?? '',
    ])))
}

async function downloadFile(url, destination) {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status}`)
    }

    if (!response.body) {
        throw new Error(`No response body for ${url}`)
    }

    await pipeline(response.body, createWriteStream(destination))
}

async function loadCsv(filename) {
    mkdirSync(CACHE_DIR, {recursive: true})
    const destination = join(CACHE_DIR, filename)

    if (!existsSync(destination)) {
        console.log(`Downloading ${filename}...`)
        await downloadFile(`${OURAIRPORTS_BASE}/${filename}`, destination)
    }

    return parseCsv(readFileSync(destination, 'utf8'))
}

function toNumber(value) {
    const parsed = Number.parseFloat(value)

    return Number.isFinite(parsed) ? parsed : null
}

function normalizeCode(value) {
    return String(value ?? '').trim().toUpperCase()
}

function isValidAirportCode(code) {
    return /^[A-Z0-9-]{2,8}$/.test(code)
}

function isMilitaryAirport(row) {
    const name = row.name ?? ''
    const keywords = row.keywords ?? ''

    if (MILITARY_NAME_PATTERN.test(name)) {
        return true
    }

    return /\bmilitary\b/i.test(keywords)
}

function classifyAirport(row, maxRunwayFt) {
    if (isMilitaryAirport(row)) {
        return 'military'
    }

    if (row.type === 'large_airport') {
        return 'major'
    }

    if (row.type === 'medium_airport' && (row.scheduled_service === 'yes' || row.iata_code)) {
        return 'major'
    }

    if (row.iata_code || (row.scheduled_service === 'yes' && maxRunwayFt >= 5000)) {
        return 'major'
    }

    return 'strip'
}

function buildAirportCode(row, usedCodes, airportId) {
    const candidates = [
        normalizeCode(row.icao_code),
        normalizeCode(row.gps_code),
        normalizeCode(row.ident),
        `OA${airportId}`,
    ].filter((code) => isValidAirportCode(code))

    for (const candidate of candidates) {
        if (!usedCodes.has(candidate)) {
            usedCodes.add(candidate)
            return candidate
        }
    }

    let suffix = 2
    const base = candidates[0] ?? `OA${airportId}`

    while (usedCodes.has(`${base}-${suffix}`)) {
        suffix += 1
    }

    const code = `${base}-${suffix}`
    usedCodes.add(code)

    return code
}

function haversineNm(lat1, lng1, lat2, lng2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180)
    const earthRadiusNm = 3440.065
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2

    return 2 * earthRadiusNm * Math.asin(Math.sqrt(a))
}

function gridKey(lat, lng) {
    const latCell = Math.floor(lat / GRID_CELL_DEG)
    const lngCell = Math.floor(lng / GRID_CELL_DEG)

    return `${latCell}:${lngCell}`
}

function buildSpatialIndex(airports) {
    const buckets = new Map()

    airports.forEach((airport) => {
        const key = gridKey(airport.lat, airport.lng)
        const bucket = buckets.get(key) ?? []
        bucket.push(airport)
        buckets.set(key, bucket)
    })

    return buckets
}

function collectNearbyAirports(airport, buckets, maxDistanceNm, classFilter = null) {
    const latCell = Math.floor(airport.lat / GRID_CELL_DEG)
    const lngCell = Math.floor(airport.lng / GRID_CELL_DEG)
    const neighbors = []

    for (let latOffset = -2; latOffset <= 2; latOffset += 1) {
        for (let lngOffset = -2; lngOffset <= 2; lngOffset += 1) {
            const bucket = buckets.get(`${latCell + latOffset}:${lngCell + lngOffset}`) ?? []

            bucket.forEach((candidate) => {
                if (candidate.icao === airport.icao) {
                    return
                }

                if (classFilter && candidate.class !== classFilter) {
                    return
                }

                const distanceNm = haversineNm(
                    airport.lat,
                    airport.lng,
                    candidate.lat,
                    candidate.lng,
                )

                if (distanceNm <= maxDistanceNm) {
                    neighbors.push({airport: candidate, distanceNm})
                }
            })
        }
    }

    neighbors.sort((left, right) => left.distanceNm - right.distanceNm)

    return neighbors
}

function pairKey(originIcao, destinationIcao) {
    return originIcao < destinationIcao
        ? `${originIcao}|${destinationIcao}`
        : `${destinationIcao}|${originIcao}`
}

function routeWeightForPair(originClass, destinationClass, distanceNm) {
    const left = originClass < destinationClass ? originClass : destinationClass
    const right = originClass < destinationClass ? destinationClass : originClass
    const base = ROUTE_WEIGHT_BY_PAIR[`${left}-${right}`] ?? 2
    const distanceFactor = Math.max(1, Math.min(3, distanceNm / 250))

    return Math.max(1, Math.round(base * distanceFactor))
}

function routeMetadata(origin, destination) {
    const isMilitary = origin.class === 'military' || destination.class === 'military'
    const trafficKind = isMilitary ? 'military' : 'commercial'
    const profile = isMilitary
        ? MILITARY_PROFILES[(origin.icao.charCodeAt(0) + destination.icao.charCodeAt(0)) % MILITARY_PROFILES.length]
        : (origin.class === 'major' || destination.class === 'major' ? 'commercial' : 'civilian')

    return {
        trafficKind,
        profile,
        nationality: origin.nationality || destination.nationality || '',
    }
}

function maxDistanceForClass(airportClass) {
    if (airportClass === 'major') {
        return 6000
    }

    if (airportClass === 'military') {
        return 2500
    }

    return 350
}

function generateRoutes(airports) {
    const buckets = buildSpatialIndex(airports)
    const seenPairs = new Set()
    const routes = []

    const addRoute = (origin, destination) => {
        if (origin.icao === destination.icao) {
            return false
        }

        const key = pairKey(origin.icao, destination.icao)

        if (seenPairs.has(key)) {
            return false
        }

        seenPairs.add(key)

        const distanceNm = haversineNm(origin.lat, origin.lng, destination.lat, destination.lng)
        const metadata = routeMetadata(origin, destination)

        routes.push({
            id: `${origin.icao}-${destination.icao}`,
            origin: origin.icao,
            destination: destination.icao,
            weight: routeWeightForPair(origin.class, destination.class, distanceNm),
            ...metadata,
        })

        return true
    }

    airports.forEach((airport) => {
        const limits = NEIGHBOR_LIMITS[airport.class]

        Object.entries(limits).forEach(([targetClass, limit]) => {
            if (limit <= 0) {
                return
            }

            const nearby = collectNearbyAirports(
                airport,
                buckets,
                maxDistanceForClass(airport.class),
                targetClass,
            ).slice(0, limit)

            nearby.forEach(({airport: destination}) => {
                addRoute(airport, destination)
            })
        })
    })

    routes.sort((left, right) => left.id.localeCompare(right.id))

    return routes
}

function buildAirports(airportRows, runwayRows) {
    const maxRunwayByAirport = new Map()

    runwayRows.forEach((row) => {
        if (row.closed === '1') {
            return
        }

        const lengthFt = Number.parseInt(row.length_ft ?? '0', 10) || 0
        const airportRef = row.airport_ref
        const current = maxRunwayByAirport.get(airportRef) ?? 0

        if (lengthFt > current) {
            maxRunwayByAirport.set(airportRef, lengthFt)
        }
    })

    const usedCodes = new Set()
    const airports = []

    airportRows.forEach((row) => {
        const maxRunwayFt = maxRunwayByAirport.get(row.id) ?? 0

        if (maxRunwayFt < MIN_RUNWAY_FT) {
            return
        }

        if (row.type === 'heliport' || row.type === 'closed') {
            return
        }

        const lat = toNumber(row.latitude_deg)
        const lng = toNumber(row.longitude_deg)

        if (lat === null || lng === null) {
            return
        }

        const icao = buildAirportCode(row, usedCodes, row.id)
        const airportClass = classifyAirport(row, maxRunwayFt)
        const name = String(row.name ?? icao).trim() || icao

        airports.push({
            icao,
            name,
            lng: Number(lng.toFixed(4)),
            lat: Number(lat.toFixed(4)),
            class: airportClass,
            nationality: normalizeCode(row.iso_country),
        })
    })

    airports.sort((left, right) => left.icao.localeCompare(right.icao))

    return airports
}

function writeJson(path, value) {
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main() {
    const [airportRows, runwayRows] = await Promise.all([
        loadCsv('airports.csv'),
        loadCsv('runways.csv'),
    ])

    const airports = buildAirports(airportRows, runwayRows)
    const routes = generateRoutes(airports)

    mkdirSync(DATA_DIR, {recursive: true})
    writeJson(join(DATA_DIR, 'airports.json'), airports)
    writeJson(join(DATA_DIR, 'airRoutes.json'), routes)

    const summary = {
        airports: airports.length,
        routes: routes.length,
        classes: airports.reduce((counts, airport) => {
            counts[airport.class] = (counts[airport.class] ?? 0) + 1
            return counts
        }, {}),
        fingerprint: createHash('sha256')
            .update(JSON.stringify({airports, routes}))
            .digest('hex')
            .slice(0, 12),
    }

    console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
