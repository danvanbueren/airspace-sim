export function formatDateTimeGroup(date) {
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    }).replace(',', '').replace(/^(\d{2}) (\w{3}) (\d{2})/, '$1-$2-$3').replace(/:/g, '') + 'Z'
}