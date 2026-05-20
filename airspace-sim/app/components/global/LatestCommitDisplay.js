import {useEffect, useState} from 'react'
import fetchLatestGithubCommit from '@/app/tools/external/fetchLatestGithubCommit'
import {Button, Stack, Typography} from "@mui/material";
import {formatDateTimeGroup} from '../../tools/formatting/DateTime'

export default function LatestCommitDisplay() {
    const [commit, setCommit] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        let ignore = false

        fetchLatestGithubCommit()
            .then((latestCommit) => {
                if (!ignore) {
                    setCommit(latestCommit)
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setError(error)
                }
            })

        return () => {
            ignore = true
        }
    }, [])

    if (error) {
        return <>Unable to load.</>
    }

    if (!commit) {
        return <>Loading…</>
    }

    return (
        <>
            <Stack sx={{ display: 'flex', alignItems: 'start', width: '100%' }}>
                <Button
                    variant='outlined'
                    href={commit.url}
                    target='_blank'
                    rel="noreferrer"
                    sx={{
                        px: 1,
                        py: 0,
                    }}
                >
                    {commit.shortSha}
                </Button>

                <Typography
                    variant='body'
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        fontStyle: 'italic',
                    }}
                >
                    {commit.message} aksjdhfklajshdflkjhasldkjfhalksdj ajskdf asdflkhj afdskljh
                </Typography>

                <Typography
                    variant='body'
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 'normal',
                    }}
                >
                    {formatDateTimeGroup(commit.date)}
                </Typography>

            </Stack>
        </>
    )
}