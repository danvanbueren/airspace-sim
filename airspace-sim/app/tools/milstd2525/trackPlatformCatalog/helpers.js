export const UNSPECIFIED_OPTION = {value: '', label: 'Unspecified'}

export function platform(value, label) {
    return {value, label}
}

export function withUnspecified(platforms) {
    return [UNSPECIFIED_OPTION, ...platforms]
}
