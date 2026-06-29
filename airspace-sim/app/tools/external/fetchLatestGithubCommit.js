import buildInfo from '../../buildInfo'
import {EXTERNAL_LINKS} from '../../content/externalLinks'

const OWNER = buildInfo().githubRepoOwner
const REPO = buildInfo().githubRepoName
const GITHUB_API_BASE = EXTERNAL_LINKS.github.apiBase
const CACHE_TTL_MS = 1000 * 60 * 2 // 2 minutes

const commitCache = new Map()

function buildCacheKey({owner, repo, branch}) {
    return [owner, repo, branch].filter(Boolean).join('/')
}

function getCachedCommit(cacheKey, cacheTtlMs) {
    const cached = commitCache.get(cacheKey)

    if (!cached) {
        return null
    }

    if (Date.now() - cached.timestamp > cacheTtlMs) {
        commitCache.delete(cacheKey)
        return null
    }

    return cached.value
}

function setCachedCommit(cacheKey, value) {
    commitCache.set(cacheKey, {
        timestamp: Date.now(),
        value,
    })
}

function getCommitAuthor(latestCommit) {
    const githubAuthor = latestCommit.author
    const commitAuthor = latestCommit.commit?.author

    return {
        username: githubAuthor?.login ?? commitAuthor?.name ?? 'Unknown',
        name: commitAuthor?.name ?? githubAuthor?.login ?? 'Unknown',
        avatarUrl: githubAuthor?.avatar_url ?? null,
        profileUrl: githubAuthor?.html_url ?? null,
    }
}

function formatLatestCommit(latestCommit) {
    const commitDate = latestCommit.commit?.author?.date
        ? new Date(latestCommit.commit.author.date)
        : null

    return {
        sha: latestCommit.sha,
        shortSha: latestCommit.sha?.slice(0, 7) ?? null,
        message: latestCommit.commit?.message ?? '',
        url: latestCommit.html_url,
        date: commitDate,
        dateIso: commitDate?.toISOString() ?? null,
        author: getCommitAuthor(latestCommit),
    }
}

export default async function fetchLatestGithubCommit({
                                                          owner = OWNER,
                                                          username,
                                                          repo = REPO,
                                                          branch,
                                                          cacheTtlMs = CACHE_TTL_MS,
                                                          signal,
                                                      } = {}) {
    const resolvedOwner = owner ?? username
    const cacheKey = buildCacheKey({owner: resolvedOwner, repo, branch})
    const cachedCommit = getCachedCommit(cacheKey, cacheTtlMs)

    if (cachedCommit) {
        return cachedCommit
    }

    const searchParams = new URLSearchParams({
        per_page: '1',
    })

    if (branch) {
        searchParams.set('sha', branch)
    }

    const apiUrl = `${GITHUB_API_BASE}/repos/${resolvedOwner}/${repo}/commits?${searchParams}`

    const commitRequest = fetch(apiUrl, {
        headers: {
            Accept: 'application/vnd.github+json',
        },
        signal,
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`GitHub commit request failed: ${response.status} ${response.statusText}`)
            }

            const commits = await response.json()

            if (!Array.isArray(commits) || commits.length === 0) {
                return null
            }

            return formatLatestCommit(commits[0])
        })
        .catch((error) => {
            commitCache.delete(cacheKey)
            throw error
        })

    setCachedCommit(cacheKey, commitRequest)

    return commitRequest

    /*
    RETURNED OBJECT STRUCTURE

    {
        sha: 'fullCommitSha',
        shortSha: 'abc1234',
        message: 'Commit message',
        url: 'https://github.com/owner/repo/commit/...',
        date: Date,
        dateIso: '2026-05-20T00:00:00.000Z',
        author: {
            username: 'githubUsername',
            name: 'Commit Author',
            avatarUrl: 'https://...',
            profileUrl: 'https://github.com/githubUsername'
        }
    }
    */
}