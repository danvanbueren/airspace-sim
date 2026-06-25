import ConstructionIcon from '@mui/icons-material/Construction'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import {Button, Grid, Link, Stack, Typography} from "@mui/material";
import buildInfo from '../../../../../buildInfo'
import {ABOUT_ATTRIBUTIONS} from '../../../../../content/about-attributions'
import LatestCommitDisplay from "../../../../global/LatestCommitDisplay";
import SettingsModalAboutAttributionEntry from './SettingsModalAboutAttributionEntry'

export default function SettingsModalAboutPage() {

    const info = buildInfo()

    return (
        <Stack
            spacing={1}
            sx={{
                fontWeight: 'bold',
            }}
        >
            <Typography
                variant='h6'
            >
                {info.projectName} {info.fullyQualifiedVersion}
            </Typography>

            <Typography sx={{lineHeight: 1.7}}>
                A spiritual successor to John McCarthy&apos;s <Button variant='text' href={info.parrotSourLink} target='_blank' sx={{p:0, m:0}}>ParrotSour</Button>, {info.projectName} is a non-secure simulator for training Command and Control aircrew, operators, and controllers in a simulated operational environment. This project is personal and is not owned, operated, or endorsed by any government entity. This software is unclassified.
            </Typography>

            <Typography
                variant='h6'
                sx={{
                    pt: 2,
                }}
            >
                Technical Specifications
            </Typography>

            <Grid container>

                <Grid size={3} sx={{ mb: 1 }}>
                    <Typography>
                        Version:
                    </Typography>
                </Grid>

                <Grid size={9} sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>
                        {info.fullyQualifiedVersion}
                    </Typography>
                </Grid>

                <Grid size={3} sx={{ mb: 1 }}>
                    <Typography>Last Commit:</Typography>
                </Grid>

                <Grid size={9} sx={{ mb: 1 }}>
                    <LatestCommitDisplay/>
                </Grid>

                <Grid size={3} sx={{ mb: 1 }}>
                    <Typography>
                        GitHub Repo:
                    </Typography>
                </Grid>

                <Grid size={9} sx={{ mb: 1 }}>
                    <Button
                        variant='outlined'
                        href={info.githubRepoLink}
                        target='_blank'
                        sx={{
                            px: 1,
                            py: 0,
                        }}
                    >
                        /{info.githubRepoOwner}/{info.githubRepoName}
                    </Button>
                </Grid>

                <Grid size={3} sx={{ mb: 1 }}>
                    <Typography>
                        Report Issues:
                    </Typography>
                </Grid>

                <Grid size={9} sx={{ mb: 1 }}>
                    <Button
                        variant='outlined'
                        href={info.githubIssuesLink}
                        target='_blank'
                        sx={{
                            px: 1,
                            py: 0,
                        }}
                    >
                        /{info.githubRepoOwner}/{info.githubRepoName}/issues
                    </Button>
                </Grid>

            </Grid>

            <Typography
                variant='h6'
                sx={{
                    pt: 2,
                }}
            >
                Attributions
            </Typography>

            <Typography sx={{lineHeight: 1.7, fontWeight: 'normal', mb: 1}}>
                {info.projectName} is built on open-source libraries, map data, and other projects. Credit and copyright belong to their respective authors.
            </Typography>

            {ABOUT_ATTRIBUTIONS.map((entry) => (
                <SettingsModalAboutAttributionEntry
                    key={entry.name}
                    entry={entry}
                />
            ))}

            <Typography
                variant='h6'
                sx={{
                    pt: 2,
                }}
            >
                Disclaimers
            </Typography>

            <Grid container spacing={1.5} sx={{mb: 1.5}}>
                <Grid size='auto'>
                    <ConstructionIcon sx={{mt: 0.2, color: 'text.secondary'}} />
                </Grid>
                <Grid size='grow'>
                    <Typography sx={{lineHeight: 1.7, fontWeight: 'normal'}}>
                        This simulator is a work in progress. Large changes ship regularly, so you may encounter rough edges, regressions, or unexpected behavior. Please report anything that looks wrong in{' '}
                        <Link href={info.githubIssuesLink} target='_blank' rel='noreferrer'>
                            GitHub Issues
                        </Link>
                        .
                    </Typography>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{mb: 1.5}}>
                <Grid size='auto'>
                    <AutoFixHighIcon sx={{mt: 0.2, color: 'text.secondary'}} />
                </Grid>
                <Grid size='grow'>
                    <Typography sx={{lineHeight: 1.7, fontWeight: 'normal'}}>
                        Development relies heavily on AI-assisted tooling. That pace helps the project move quickly, but it also increases the risk of subtle bugs and incomplete polish. Reporting issues when you find them is essential to keeping this high-speed development tempo sustainable.
                    </Typography>
                </Grid>
            </Grid>

            <Typography
                variant='h6'
                sx={{
                    pt: 2,
                }}
            >
                Copyright Notice
            </Typography>

            <Typography>{info.copyrightTitle}</Typography>
            <Typography sx={(theme) => ({fontSize: 12, color: theme.palette.text.secondary})}>{info.copyrightDescription}</Typography>
        </Stack>
    )
}