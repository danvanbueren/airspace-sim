import {normalizeNationality} from './trackNationalities.js'

const ICAO_PREFIX_TO_NATIONALITY = [
    ['AG', 'AG'], ['AN', 'CW'], ['AY', 'PG'], ['BG', 'GL'], ['BI', 'IS'],
    ['BK', 'XK'], ['CY', 'CA'], ['DA', 'DZ'], ['DB', 'BJ'], ['DF', 'BF'],
    ['DG', 'GH'], ['DI', 'CI'], ['DN', 'NG'], ['DR', 'NE'], ['DT', 'TN'],
    ['DX', 'TG'], ['EB', 'BE'], ['ED', 'DE'], ['EE', 'EE'], ['EF', 'FI'],
    ['EG', 'GB'], ['EH', 'NL'], ['EI', 'IE'], ['EK', 'DK'], ['EL', 'LU'],
    ['EN', 'NO'], ['EP', 'IR'], ['ES', 'SE'], ['ET', 'ET'], ['EV', 'LV'],
    ['EW', 'BY'], ['FA', 'ZA'], ['FB', 'BW'], ['FC', 'CG'], ['FD', 'SZ'],
    ['FE', 'CF'], ['FG', 'GQ'], ['FH', 'SH'], ['FI', 'MU'], ['FJ', 'KM'],
    ['FK', 'CM'], ['FL', 'ZM'], ['FM', 'MG'], ['FN', 'AO'], ['FO', 'ST'],
    ['FP', 'SC'], ['FQ', 'MZ'], ['FS', 'SC'], ['FT', 'TD'], ['FV', 'ZW'],
    ['FW', 'MW'], ['FX', 'LS'], ['FY', 'NA'], ['FZ', 'CD'], ['GA', 'ML'],
    ['GB', 'GM'], ['GC', 'ES'], ['GE', 'ES'], ['GF', 'ES'], ['GG', 'GG'],
    ['GL', 'GL'], ['GM', 'ES'], ['GO', 'SN'], ['GQ', 'PT'], ['GS', 'EH'],
    ['GU', 'GT'], ['GV', 'CV'], ['HA', 'ET'], ['HB', 'BI'], ['HC', 'SO'],
    ['HD', 'DJ'], ['HE', 'EG'], ['HH', 'ER'], ['HK', 'HK'], ['HL', 'LY'],
    ['HR', 'RW'], ['HS', 'SD'], ['HT', 'TZ'], ['HU', 'UG'], ['K', 'US'],
    ['LA', 'AL'], ['LB', 'BG'], ['LC', 'CY'], ['LD', 'HR'], ['LE', 'ES'],
    ['LF', 'FR'], ['LG', 'GR'], ['LH', 'HU'], ['LI', 'IT'], ['LJ', 'SI'],
    ['LK', 'CZ'], ['LL', 'IL'], ['LM', 'MT'], ['LN', 'LY'], ['LO', 'AT'],
    ['LP', 'PT'], ['LQ', 'BA'], ['LR', 'RO'], ['LS', 'CH'], ['LT', 'TR'],
    ['LU', 'MD'], ['LV', 'ES'], ['LW', 'MK'], ['LX', 'CH'], ['LY', 'RS'],
    ['LZ', 'SK'], ['MB', 'TC'], ['MD', 'DO'], ['MG', 'GT'], ['MH', 'HN'],
    ['MK', 'JM'], ['MM', 'MX'], ['MN', 'NI'], ['MP', 'PA'], ['MR', 'CR'],
    ['MS', 'EG'], ['MT', 'LB'], ['MU', 'CU'], ['MW', 'CA'], ['MY', 'BS'],
    ['MZ', 'BZ'], ['NC', 'NZ'], ['NF', 'FJ'], ['NG', 'NE'], ['NH', 'VU'],
    ['NI', 'ID'], ['NL', 'VU'], ['NS', 'SR'], ['NT', 'PF'], ['NV', 'VU'],
    ['NW', 'FR'], ['NZ', 'NZ'], ['OA', 'AF'], ['OB', 'BH'], ['OE', 'SA'],
    ['OI', 'IR'], ['OJ', 'JO'], ['OK', 'KW'], ['OL', 'LB'], ['OM', 'AE'],
    ['OO', 'OM'], ['OP', 'PK'], ['OR', 'IQ'], ['OS', 'SY'], ['OT', 'QA'],
    ['OY', 'YE'], ['PA', 'US'], ['PB', 'US'], ['PC', 'CK'], ['PF', 'PF'],
    ['PG', 'GU'], ['PH', 'US'], ['PJ', 'US'], ['PK', 'MH'], ['PL', 'SB'],
    ['PM', 'US'], ['PT', 'PT'], ['PW', 'PW'], ['RC', 'TW'], ['RJ', 'JP'],
    ['RK', 'KR'], ['RO', 'PH'], ['RP', 'PH'], ['SA', 'AR'], ['SB', 'BR'],
    ['SC', 'CL'], ['SD', 'BR'], ['SE', 'EC'], ['SF', 'GB'], ['SG', 'SR'],
    ['SK', 'CO'], ['SL', 'SR'], ['SM', 'SR'], ['SN', 'BR'], ['SO', 'FR'],
    ['SP', 'PE'], ['SS', 'BR'], ['SU', 'UY'], ['SV', 'SV'], ['SW', 'NA'],
    ['SY', 'GY'], ['TA', 'AG'], ['TB', 'BB'], ['TD', 'TT'], ['TF', 'FR'],
    ['TG', 'GD'], ['TI', 'CR'], ['TJ', 'BS'], ['TK', 'TC'], ['TL', 'KN'],
    ['TN', 'PA'], ['TQ', 'GB'], ['TR', 'GB'], ['TT', 'BR'], ['TU', 'PA'],
    ['TV', 'TV'], ['TX', 'BM'], ['UA', 'KZ'], ['UB', 'AZ'], ['UC', 'AU'],
    ['UD', 'AM'], ['UE', 'RU'], ['UG', 'GE'], ['UK', 'UA'], ['UL', 'RU'],
    ['UM', 'RU'], ['UN', 'KZ'], ['UO', 'RU'], ['UR', 'UA'], ['US', 'UZ'],
    ['UT', 'TM'], ['UU', 'RU'], ['UW', 'UZ'], ['VA', 'IN'], ['VC', 'LK'],
    ['VD', 'KH'], ['VE', 'CA'], ['VG', 'GD'], ['VH', 'HK'], ['VI', 'IN'],
    ['VL', 'LA'], ['VM', 'MO'], ['VN', 'VN'], ['VO', 'IN'], ['VQ', 'BT'],
    ['VR', 'MV'], ['VT', 'TH'], ['VV', 'VN'], ['VY', 'MM'], ['WA', 'ID'],
    ['WB', 'MY'], ['WI', 'ID'], ['WM', 'MY'], ['WP', 'TL'], ['WQ', 'ID'],
    ['WR', 'ID'], ['WS', 'SG'], ['YB', 'AU'], ['YM', 'AU'], ['YP', 'AU'],
    ['YS', 'AU'], ['ZB', 'CN'], ['ZG', 'CN'], ['ZH', 'CN'], ['ZK', 'CN'],
    ['ZL', 'CN'], ['ZM', 'MN'], ['ZN', 'NE'], ['ZP', 'PY'], ['ZS', 'CN'],
    ['ZU', 'CN'], ['ZV', 'CN'], ['ZW', 'CN'], ['ZY', 'CN'],
].sort((left, right) => right[0].length - left[0].length)

const ICAO_PREFIX_LOOKUP = new Map(ICAO_PREFIX_TO_NATIONALITY)

export function getNationalityFromAirportIcao(icao) {
    const normalizedIcao = String(icao ?? '').trim().toUpperCase()

    if (!normalizedIcao) {
        return ''
    }

    for (let prefixLength = Math.min(4, normalizedIcao.length); prefixLength > 0; prefixLength -= 1) {
        const nationality = ICAO_PREFIX_LOOKUP.get(normalizedIcao.slice(0, prefixLength))

        if (nationality) {
            return nationality
        }
    }

    return ''
}

export function resolveAutoTrackNationalityFromAircraft(aircraft, random = Math.random) {
    if (!aircraft) {
        return ''
    }

    const originIcao = aircraft.origin ?? aircraft.homeAirportIcao ?? null
    const destinationIcao = aircraft.destination ?? aircraft.homeAirportIcao ?? null
    const originNationality = normalizeNationality(getNationalityFromAirportIcao(originIcao))
    const destinationNationality = normalizeNationality(getNationalityFromAirportIcao(destinationIcao))
    const candidates = [...new Set(
        [originNationality, destinationNationality].filter((nationality) => nationality !== ''),
    )]

    if (candidates.length === 0) {
        return ''
    }

    if (candidates.length === 1) {
        return candidates[0]
    }

    return candidates[Math.floor(random() * candidates.length)]
}
