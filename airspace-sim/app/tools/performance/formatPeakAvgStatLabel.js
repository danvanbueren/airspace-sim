export function formatNumericValue(value, fractionDigits = 2) {
    if (!Number.isFinite(value)) {
        return '0'
    }

    if (fractionDigits <= 0) {
        return String(Math.round(value))
    }

    return value.toFixed(fractionDigits)
}

export function formatPeakAvgStatLabel(
    labelPrefix,
    leadingValue,
    avgValue,
    {
        suffix = '',
        leadingFractionDigits = 2,
        avgFractionDigits = 2,
    } = {},
) {
    const values = `${formatNumericValue(leadingValue, leadingFractionDigits)}/${formatNumericValue(avgValue, avgFractionDigits)}`
    const suffixPart = suffix ? ` ${suffix}` : ''

    return `${labelPrefix}: ${values}${suffixPart}`
}

export function resolveFittedPeakAvgStatLabel(
    labelPrefix,
    leadingValue,
    avgValue,
    fits,
    {
        suffix = '',
        leadingFractionDigits = 2,
        avgFractionDigits = 2,
    } = {},
) {
    let nextLeadingFractionDigits = leadingFractionDigits
    let nextAvgFractionDigits = avgFractionDigits
    let label = formatPeakAvgStatLabel(labelPrefix, leadingValue, avgValue, {
        suffix,
        leadingFractionDigits: nextLeadingFractionDigits,
        avgFractionDigits: nextAvgFractionDigits,
    })

    while (!fits(label) && (nextLeadingFractionDigits > 0 || nextAvgFractionDigits > 0)) {
        if (nextLeadingFractionDigits >= nextAvgFractionDigits && nextLeadingFractionDigits > 0) {
            nextLeadingFractionDigits -= 1
        } else if (nextAvgFractionDigits > 0) {
            nextAvgFractionDigits -= 1
        } else {
            nextLeadingFractionDigits -= 1
        }

        label = formatPeakAvgStatLabel(labelPrefix, leadingValue, avgValue, {
            suffix,
            leadingFractionDigits: nextLeadingFractionDigits,
            avgFractionDigits: nextAvgFractionDigits,
        })
    }

    return label
}
