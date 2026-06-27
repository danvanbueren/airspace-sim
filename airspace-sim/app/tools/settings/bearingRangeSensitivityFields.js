import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'

export const BEARING_RANGE_SENSITIVITY_FIELDS = [
    {
        key: 'contextMenuMaxMs',
        label: 'Context Menu Timeout',
        helperText: 'Milliseconds',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
    {
        key: 'contextMenuMaxPixels',
        label: 'Context Menu Movement Limit',
        helperText: 'Pixels',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
    {
        key: 'minPersistedLinePixels',
        label: 'Minimum Line Length',
        helperText: 'Pixels',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
]
