import packageJson from '../package.json'

export default function buildInfo() {
    // descriptors
    const projectName = 'Airspace Simulator'
    const githubRepoName = 'airspace-sim'
    const githubRepoOwner = 'danvanbueren'

    // links
    const githubOwnerLink = `https://github.com/${githubRepoOwner}`
    const githubRepoLink = `https://github.com/${githubRepoOwner}/${githubRepoName}`
    const githubIssuesLink = `https://github.com/${githubRepoOwner}/${githubRepoName}/issues`
    const parrotSourLink = 'https://parrotsour.com/'

    // version info
    const packageVersion = packageJson.version
    const [versionEdition = '0', versionMajor = '0', versionMinor = '0'] =
        packageVersion.split('.')
    const versionFlag = 'indev'

    // full version
    const fullyQualifiedVersion = packageVersion + '-' + versionFlag

    // copyright notice
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