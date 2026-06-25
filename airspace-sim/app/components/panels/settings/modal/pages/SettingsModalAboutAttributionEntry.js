import {Box, Link, Typography} from '@mui/material'

const SUBDUED_LIST_SX = {
    m: 0,
    pl: 2,
    listStyleType: 'disc',
    listStylePosition: 'outside',
}

const SUBDUED_ITEM_SX = {
    display: 'list-item',
    lineHeight: 1.5,
    fontSize: 11,
    color: 'text.secondary',
    fontWeight: 'normal',
    '&::marker': {
        fontSize: 10,
    },
}

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
        <Box sx={{mb: 1.25}}>
            <Typography
                variant='body2'
                sx={{
                    lineHeight: 1.6,
                    fontWeight: 'normal',
                }}
            >
                <AttributionLink
                    href={entry.projectHref}
                    sx={{fontWeight: 'bold'}}
                >
                    {entry.name}
                </AttributionLink>
                {' by '}
                <AttributionLink href={entry.authorHref}>
                    {entry.author}
                </AttributionLink>
                {' — Copyright © '}
                {entry.copyrightHolder}
            </Typography>

            <Box component='ul' sx={SUBDUED_LIST_SX}>
                <Typography component='li' sx={SUBDUED_ITEM_SX}>
                    License:{' '}
                    <AttributionLink href={entry.licenseHref}>
                        {entry.license}
                    </AttributionLink>
                </Typography>

                {entry.note ? (
                    <Typography component='li' sx={SUBDUED_ITEM_SX}>
                        {entry.note}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    )
}
