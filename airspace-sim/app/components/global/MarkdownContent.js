'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {Box, Link, Typography} from '@mui/material'

export default function MarkdownContent({source, sx}) {
    const markdown = typeof source === 'string' ? source : ''

    if (!markdown.trim()) {
        return (
            <Typography variant='body2' color='text.secondary'>
                No content to display.
            </Typography>
        )
    }

    return (
        <Box
            sx={{
                '& h2': {
                    typography: 'h6',
                    fontWeight: 'bold',
                    mt: 2.5,
                    mb: 1,
                    '&:first-of-type': {mt: 0},
                },
                '& p': {
                    typography: 'body2',
                    color: 'text.secondary',
                    mb: 2,
                    lineHeight: 1.7,
                },
                '& ul': {
                    pl: 0,
                    mb: 2,
                    listStyle: 'none',
                },
                '& li': {
                    typography: 'body2',
                    mb: 0.75,
                    lineHeight: 1.6,
                    pl: 0.5,
                },
                '& li:has(input[type="checkbox"])': {
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                },
                '& input[type="checkbox"]': {
                    mt: 0.35,
                    accentColor: 'primary.main',
                    pointerEvents: 'none',
                },
                '& a': {
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {textDecoration: 'underline'},
                },
                '& code': {
                    fontFamily: 'monospace',
                    fontSize: '0.85em',
                    bgcolor: 'action.hover',
                    px: 0.5,
                    borderRadius: 0.5,
                },
                ...sx,
            }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({href, children}) => (
                        <Link href={href} target='_blank' rel='noreferrer'>
                            {children}
                        </Link>
                    ),
                }}
            >
                {markdown}
            </ReactMarkdown>
        </Box>
    )
}
