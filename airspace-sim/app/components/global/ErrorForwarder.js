'use client'

import {Component, useEffect} from 'react'

function formatErrorMessage(errorLike) {
    if (!errorLike) {
        return 'Unknown error'
    }

    if (errorLike instanceof Error) {
        return errorLike.stack || errorLike.message || String(errorLike)
    }

    if (typeof errorLike === 'object') {
        try {
            return JSON.stringify(errorLike)
        } catch {
            return String(errorLike)
        }
    }

    return String(errorLike)
}

export class ReactErrorForwardingBoundary extends Component {
    constructor(props) {
        super(props)

        this.state = {
            hasError: false,
        }
    }

    static getDerivedStateFromError() {
        return {
            hasError: true,
        }
    }

    componentDidCatch(error, errorInfo) {
        this.props.onError(
            [
                this.props.name ? `React component error: ${this.props.name}` : 'React component error',
                formatErrorMessage(error),
                errorInfo?.componentStack,
            ]
                .filter(Boolean)
                .join('\n')
        )
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null
        }

        return this.props.children
    }
}

export default function ErrorForwarder({onError, children}) {
    useEffect(() => {
        const forwardError = (message) => {
            onError(message)
        }

        const handleWindowError = (event) => {
            forwardError(
                [
                    'Browser error',
                    event.message,
                    event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : null,
                    event.error ? formatErrorMessage(event.error) : null,
                ]
                    .filter(Boolean)
                    .join('\n')
            )
        }

        const handleUnhandledRejection = (event) => {
            forwardError(
                [
                    'Unhandled promise rejection',
                    formatErrorMessage(event.reason),
                ]
                    .filter(Boolean)
                    .join('\n')
            )
        }

        window.addEventListener('error', handleWindowError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        return () => {
            window.removeEventListener('error', handleWindowError)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [onError])

    return children
}