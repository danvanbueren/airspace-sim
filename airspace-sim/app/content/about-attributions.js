/**
 * Third-party libraries, data sources, and projects credited on Settings → About.
 * Keep in sync with package.json dependencies and README Tech Stack.
 */
import {EXTERNAL_LINKS} from './externalLinks'

const {attributions} = EXTERNAL_LINKS

export const ABOUT_ATTRIBUTIONS = [
    {
        name: 'Next.js',
        ...attributions.nextjs,
        author: 'Vercel, Inc.',
        copyrightHolder: 'Vercel, Inc.',
        license: 'MIT License',
    },
    {
        name: 'React',
        ...attributions.react,
        author: 'Meta Platforms, Inc.',
        copyrightHolder: 'Meta Platforms, Inc. and affiliates',
        license: 'MIT License',
    },
    {
        name: 'Material UI',
        ...attributions.mui,
        author: 'MUI',
        copyrightHolder: 'MUI',
        license: 'MIT License',
        note: 'Includes @mui/material and @mui/icons-material.',
    },
    {
        name: 'Emotion',
        ...attributions.emotion,
        author: 'Emotion Contributors',
        copyrightHolder: 'Emotion team and contributors',
        license: 'MIT License',
        note: 'Includes @emotion/react and @emotion/styled.',
    },
    {
        name: 'MapLibre GL JS',
        ...attributions.maplibre,
        author: 'MapLibre',
        copyrightHolder: 'MapLibre contributors',
        license: 'BSD 3-Clause License',
    },
    {
        name: 'CARTO Basemaps',
        ...attributions.carto,
        author: 'CARTO',
        copyrightHolder: 'CARTO and OpenStreetMap contributors',
        license: 'Basemap terms of use',
        note: 'Voyager and Dark Matter map styles served from tiles.basemaps.cartocdn.com.',
    },
    {
        name: 'OpenStreetMap',
        ...attributions.openstreetmap,
        author: 'OpenStreetMap contributors',
        copyrightHolder: 'OpenStreetMap contributors',
        license: 'Open Database License (ODbL) 1.0',
        note: 'Map features are derived from OpenStreetMap data via CARTO basemap tiles.',
    },
    {
        name: 'milsymbol',
        ...attributions.milsymbol,
        author: 'Måns Björnberg',
        copyrightHolder: 'Måns Björnberg',
        license: 'MIT License',
    },
    {
        name: 'mgrs',
        ...attributions.mgrs,
        author: 'proj4js contributors',
        copyrightHolder: 'proj4js contributors',
        license: 'MIT License',
    },
    {
        name: 'react-markdown',
        ...attributions.reactMarkdown,
        author: 'remark unified collective',
        copyrightHolder: 'remark unified collective',
        license: 'MIT License',
    },
    {
        name: 'remark-gfm',
        ...attributions.remarkGfm,
        author: 'remark unified collective',
        copyrightHolder: 'remark unified collective',
        license: 'MIT License',
    },
    {
        name: 'Fontsource Roboto',
        ...attributions.fontsourceRoboto,
        author: 'Fontsource (Roboto by Google)',
        copyrightHolder: 'Google',
        license: 'SIL Open Font License 1.1',
        note: 'Delivered via @fontsource/roboto.',
    },
    {
        name: 'Vercel Analytics',
        ...attributions.vercelAnalytics,
        author: 'Vercel, Inc.',
        copyrightHolder: 'Vercel, Inc.',
        license: 'MIT License',
        note: 'Delivered via @vercel/analytics.',
    },
    {
        name: 'Vercel Speed Insights',
        ...attributions.vercelSpeedInsights,
        author: 'Vercel, Inc.',
        copyrightHolder: 'Vercel, Inc.',
        license: 'Apache License 2.0',
        note: 'Delivered via @vercel/speed-insights.',
    },
    {
        name: 'ParrotSour',
        ...attributions.parrotSour,
        author: 'John McCarthy',
        copyrightHolder: 'John McCarthy',
        license: 'MIT License',
        note: 'Spiritual inspiration for this project.',
    },
]
