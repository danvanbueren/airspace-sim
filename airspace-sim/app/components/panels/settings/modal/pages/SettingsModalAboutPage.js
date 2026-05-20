import {Button, Grid, Stack, Typography} from "@mui/material";
import buildInfo from '../../../../../buildInfo'
import LatestCommitDisplay from "../../../../global/LatestCommitDisplay";

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
                A spiritual successor to John McCarthy's <Button variant='text' href={info.parrotSourLink} target='_blank' sx={{p:0, m:0}}>ParrotSour</Button>, {info.projectName} is a non-secure simulator intended for use to train on a simulated operational airspace for Command and Control aircrew, operators and controllers. This project is personal, and is not owned, operated, or endorsed by any government entities. This software is unclassified.
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
                Copyright Notice
            </Typography>

            <Typography>{info.copyrightTitle}</Typography>
            <Typography sx={(theme) => ({fontSize: 12, color: theme.palette.text.secondary})}>{info.copyrightDescription}</Typography>
        </Stack>
    )
}