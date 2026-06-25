import {Link, Typography} from '@mui/material'

function AttributionLink({href, children, sx}) {
    if (!href) {
        return children
    }

    return (
        <Link
            href={href}
            target='_blank'
            rel='noreferrer'
            sx={sx}
        >
            {children}
        </Link>
    )
}

export default function SettingsModalAboutAttributionEntry({entry}) {
    return (
        <Typography
            variant='body2'
            sx={{
                lineHeight: 1.7,
                mb: 1.5,
                fontWeight: 'normal',
            }}
        >
            <AttributionLink
                href={entry.projectHref}
                sx={{fontWeight: 'bold'}}
            >
                {entry.name}
            </AttributionLink>
            {' — '}
            Author:{' '}
            <AttributionLink href={entry.authorHref}>
                {entry.author}
            </AttributionLink>
            {' — '}
            {entry.copyright}
            {' — '}
            <AttributionLink href={entry.licenseHref}>
                {entry.license}
            </AttributionLink>
            {entry.repoHref ? (
                <>
                    {' — '}
                    <AttributionLink href={entry.repoHref}>
                        Repository
                    </AttributionLink>
                </>
            ) : null}
            {entry.note ? (
                <Typography
                    component='span'
                    display='block'
                    sx={(theme) => ({
                        mt: 0.25,
                        fontSize: 12,
                        color: theme.palette.text.secondary,
                        fontWeight: 'normal',
                    })}
                >
                    {entry.note}
                </Typography>
            ) : null}
        </Typography>
    )
}
