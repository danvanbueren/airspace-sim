const DEFAULT_FRACTION_DIGITS = 2

export function formatMsValue(value, fractionDigits = DEFAULT_FRACTION_DIGITS) {
    if (!Number.isFinite(value)) {
        return '0'
    }

    if (fractionDigits <= 0) {
        return String(Math.round(value))
    }

    return value.toFixed(fractionDigits)
}

export function formatFrameMsStatLabel(
    peakMs,
    avgMs,
    peakFractionDigits = DEFAULT_FRACTION_DIGITS,
    avgFractionDigits = DEFAULT_FRACTION_DIGITS,
) {
    return `Frame (ms): ${formatMsValue(peakMs, peakFractionDigits)}/${formatMsValue(avgMs, avgFractionDigits)}`
}

export function resolveFittedFrameMsStatLabel(peakMs, avgMs, fits) {
    let peakFractionDigits = DEFAULT_FRACTION_DIGITS
    let avgFractionDigits = DEFAULT_FRACTION_DIGITS
    let label = formatFrameMsStatLabel(
        peakMs,
        avgMs,
        peakFractionDigits,
        avgFractionDigits,
    )

    while (!fits(label) && (peakFractionDigits > 0 || avgFractionDigits > 0)) {
        if (peakFractionDigits >= avgFractionDigits && peakFractionDigits > 0) {
            peakFractionDigits -= 1
        } else if (avgFractionDigits > 0) {
            avgFractionDigits -= 1
        } else {
            peakFractionDigits -= 1
        }

        label = formatFrameMsStatLabel(
            peakMs,
            avgMs,
            peakFractionDigits,
            avgFractionDigits,
        )
    }

    return label
}
