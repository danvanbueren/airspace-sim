import {useEffect} from 'react'
import fetchLatestGithubCommit from '@/app/tools/external/fetchLatestGithubCommit'

export default function usePrefetchLatestGithubCommit() {
    useEffect(() => {
        fetchLatestGithubCommit().catch(() => {})
    }, [])
}
