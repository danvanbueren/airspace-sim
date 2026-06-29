import {PROJECT_NAME} from '../config/projectName.js'

/** GitHub organization or user that owns this repository. */
export const GITHUB_REPO_OWNER = 'danvanbueren'

export const GITHUB_API_BASE = 'https://api.github.com'
export const GITHUB_WEB_BASE = 'https://github.com'

export function githubOwnerUrl(owner = GITHUB_REPO_OWNER) {
    return `${GITHUB_WEB_BASE}/${owner}`
}

export function githubRepoUrl({
    owner = GITHUB_REPO_OWNER,
    repo = PROJECT_NAME,
} = {}) {
    return `${GITHUB_WEB_BASE}/${owner}/${repo}`
}

export function githubIssuesUrl({
    owner = GITHUB_REPO_OWNER,
    repo = PROJECT_NAME,
} = {}) {
    return `${githubRepoUrl({owner, repo})}/issues`
}

export function githubCommitUrl(commitSha, {
    owner = GITHUB_REPO_OWNER,
    repo = PROJECT_NAME,
} = {}) {
    return `${githubRepoUrl({owner, repo})}/commit/${commitSha}`
}

export function githubBlobUrl(path, {
    owner = GITHUB_REPO_OWNER,
    repo = PROJECT_NAME,
    branch = 'main',
} = {}) {
    const normalizedPath = path.replace(/^\//, '')
    return `${githubRepoUrl({owner, repo})}/blob/${branch}/${normalizedPath}`
}

/**
 * Canonical external URLs for this project and its third-party dependencies.
 * Update links here rather than scattering URLs across the codebase.
 */
export const EXTERNAL_LINKS = {
    github: {
        apiBase: GITHUB_API_BASE,
        webBase: GITHUB_WEB_BASE,
        owner: GITHUB_REPO_OWNER,
        repo: PROJECT_NAME,
    },
    parrotSour: {
        site: 'https://parrotsour.com/',
        repo: 'https://github.com/jemccarthy13/parrotsour',
        author: 'https://github.com/jemccarthy13',
        license: 'https://github.com/jemccarthy13/parrotsour/blob/main/package.json',
    },
    ourAirports: {
        data: 'https://ourairports.com/data/',
        rawDataBase: 'https://davidmegginson.github.io/ourairports-data',
    },
    carto: {
        vectorTilesJson: 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json',
        glyphs: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
        voyagerSprite: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/sprite',
        darkMatterSprite: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite',
    },
    references: {
        astrouxdsClassificationMarkings: 'https://www.astrouxds.com/components/classification-markings/',
    },
    docs: {
        bearingRangeRewritePlan: 'docs/bearing-range-tool-rewrite-plan.md',
    },
    attributions: {
        nextjs: {
            projectHref: 'https://nextjs.org/',
            repoHref: 'https://github.com/vercel/next.js',
            authorHref: 'https://vercel.com/',
            licenseHref: 'https://github.com/vercel/next.js/blob/canary/license.md',
        },
        react: {
            projectHref: 'https://react.dev/',
            repoHref: 'https://github.com/facebook/react',
            authorHref: 'https://opensource.fb.com/',
            licenseHref: 'https://github.com/facebook/react/blob/main/LICENSE',
        },
        mui: {
            projectHref: 'https://mui.com/material-ui/',
            repoHref: 'https://github.com/mui/material-ui',
            authorHref: 'https://mui.com/',
            licenseHref: 'https://github.com/mui/material-ui/blob/master/LICENSE',
        },
        emotion: {
            projectHref: 'https://emotion.sh/docs/introduction',
            repoHref: 'https://github.com/emotion-js/emotion',
            authorHref: 'https://github.com/emotion-js',
            licenseHref: 'https://github.com/emotion-js/emotion/blob/main/LICENSE',
        },
        maplibre: {
            projectHref: 'https://maplibre.org/maplibre-gl-js/docs/',
            repoHref: 'https://github.com/maplibre/maplibre-gl-js',
            authorHref: 'https://maplibre.org/',
            licenseHref: 'https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt',
        },
        carto: {
            projectHref: 'https://carto.com/basemaps/',
            repoHref: 'https://github.com/CartoDB/basemap-styles',
            authorHref: 'https://carto.com/',
            licenseHref: 'https://carto.com/legal/',
        },
        openstreetmap: {
            projectHref: 'https://www.openstreetmap.org/',
            repoHref: 'https://www.openstreetmap.org/copyright',
            authorHref: 'https://www.openstreetmap.org/',
            licenseHref: 'https://opendatacommons.org/licenses/odbl/',
        },
        milsymbol: {
            projectHref: 'https://www.spatialillusions.com/milsymbol/',
            repoHref: 'https://github.com/spatialillusions/milsymbol',
            authorHref: 'https://github.com/spatialillusions',
            licenseHref: 'https://github.com/spatialillusions/milsymbol/blob/master/LICENSE',
        },
        mgrs: {
            projectHref: 'https://www.npmjs.com/package/mgrs',
            repoHref: 'https://github.com/proj4js/mgrs',
            authorHref: 'https://github.com/proj4js',
            licenseHref: 'https://github.com/proj4js/mgrs/blob/master/LICENSE.md',
        },
        reactMarkdown: {
            projectHref: 'https://github.com/remarkjs/react-markdown',
            repoHref: 'https://github.com/remarkjs/react-markdown',
            authorHref: 'https://github.com/remarkjs',
            licenseHref: 'https://github.com/remarkjs/react-markdown/blob/main/license',
        },
        remarkGfm: {
            projectHref: 'https://github.com/remarkjs/remark-gfm',
            repoHref: 'https://github.com/remarkjs/remark-gfm',
            authorHref: 'https://github.com/remarkjs',
            licenseHref: 'https://github.com/remarkjs/remark-gfm/blob/main/license',
        },
        fontsourceRoboto: {
            projectHref: 'https://fontsource.org/fonts/roboto',
            repoHref: 'https://github.com/fontsource/font-files',
            authorHref: 'https://fontsource.org/',
            licenseHref: 'https://openfontlicense.org/',
        },
        vercelAnalytics: {
            projectHref: 'https://vercel.com/docs/analytics',
            repoHref: 'https://github.com/vercel/analytics',
            authorHref: 'https://vercel.com/',
            licenseHref: 'https://github.com/vercel/analytics/blob/main/LICENSE',
        },
        vercelSpeedInsights: {
            projectHref: 'https://vercel.com/docs/speed-insights',
            repoHref: 'https://github.com/vercel/speed-insights',
            authorHref: 'https://vercel.com/',
            licenseHref: 'https://github.com/vercel/speed-insights/blob/main/LICENSE',
        },
        parrotSour: {
            projectHref: 'https://parrotsour.com/',
            repoHref: 'https://github.com/jemccarthy13/parrotsour',
            authorHref: 'https://github.com/jemccarthy13',
            licenseHref: 'https://github.com/jemccarthy13/parrotsour/blob/main/package.json',
        },
    },
}
