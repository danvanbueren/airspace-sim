'use client'

import {useEffect, useState} from 'react'
import {ATTENTION_FLASH_INTERVAL_MS} from '../../tools/map/trackAttentionDisplay'

/**
 * Global synchronized attention flash phase shared by all on-map attentions.
 * Visible for one interval, hidden for the next, repeating indefinitely.
 */
export function useAttentionFlashVisible(enabled = true) {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!enabled) {
            setVisible(true)
            return
        }

        const intervalId = window.setInterval(() => {
            setVisible((currentVisible) => !currentVisible)
        }, ATTENTION_FLASH_INTERVAL_MS)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [enabled])

    return visible
}
