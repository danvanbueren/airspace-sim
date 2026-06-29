import packageJson from '../package.json' with { type: 'json' }
import {
    EXTERNAL_LINKS,
    GITHUB_REPO_OWNER,
    githubIssuesUrl,
    githubOwnerUrl,
    githubRepoUrl,
} from './content/externalLinks'
import {PROJECT_NAME} from './config/projectName'

export default function buildInfo() {
    const projectName = PROJECT_NAME
    const githubRepoName = packageJson.name
    const githubRepoOwner = GITHUB_REPO_OWNER

    const githubOwnerLink = githubOwnerUrl(githubRepoOwner)
    const githubRepoLink = githubRepoUrl({owner: githubRepoOwner, repo: githubRepoName})
    const githubIssuesLink = githubIssuesUrl({owner: githubRepoOwner, repo: githubRepoName})
    const parrotSourLink = EXTERNAL_LINKS.parrotSour.site

    const packageVersion = packageJson.version
    const [versionEdition = '0', versionMajor = '0', versionMinor = '0'] =
        packageVersion.split('.')
    const versionFlag = 'indev'

    const fullyQualifiedVersion = packageVersion + '-' + versionFlag

    const copyrightTitle = 'COPYRIGHT © 2026 DANIEL VAN BUEREN. ALL RIGHTS RESERVED.'
    const copyrightDescription = 'THIS MATERIAL IS PROTECTED BY COPYRIGHT LAW. NO PART OF THIS WORK MAY BE COPIED, REPRODUCED, DISTRIBUTED, TRANSMITTED, DISPLAYED, OR PERFORMED IN ANY FORM OR BY ANY MEANS, ELECTRONIC, MECHANICAL, PHOTOCOPYING, RECORDING, OR OTHERWISE, WITHOUT PRIOR WRITTEN PERMISSION FROM THE COPYRIGHT OWNER.'

    return ({
        projectName,
        githubRepoName,
        githubRepoOwner,
        githubOwnerLink,
        githubRepoLink,
        githubIssuesLink,
        parrotSourLink,
        versionEdition,
        versionMajor,
        versionMinor,
        versionFlag,
        fullyQualifiedVersion,
        copyrightTitle,
        copyrightDescription,
    })
}
