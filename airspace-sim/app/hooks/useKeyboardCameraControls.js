import { useEffect } from 'react'

const MOVEMENT_KEYS = ['w', 'a', 's', 'd', 'shift']

export function useKeyboardCameraControls(mapRef, enabled) {
    useEffect(() => {
        if (!enabled)
            return

        const pressedKeys = new Set()
        let animationFrameId = null
        let lastFrameTime = null

        const moveCamera = (timestamp) => {
            if (!mapRef.current) {
                animationFrameId = null
                return
            }

            if (lastFrameTime === null)
                lastFrameTime = timestamp

            const deltaSeconds = (timestamp - lastFrameTime) / 1000
            lastFrameTime = timestamp

            const slowPanSpeed = 500
            const fastPanSpeed = 2000
            const panSpeed = pressedKeys.has('shift') ? slowPanSpeed : fastPanSpeed

            let x = 0
            let y = 0

            if (pressedKeys.has('w'))
                y -= 1
            if (pressedKeys.has('a'))
                x -= 1
            if (pressedKeys.has('s'))
                y += 1
            if (pressedKeys.has('d'))
                x += 1

            if (x !== 0 || y !== 0) {
                const length = Math.sqrt(x * x + y * y)

                mapRef.current.panBy([
                    (x / length) * panSpeed * deltaSeconds,
                    (y / length) * panSpeed * deltaSeconds,
                ], {duration: 0})
            }

            const hasMovementKey =
                pressedKeys.has('w') ||
                pressedKeys.has('a') ||
                pressedKeys.has('s') ||
                pressedKeys.has('d')

            if (hasMovementKey) {
                animationFrameId = window.requestAnimationFrame(moveCamera)
            } else {
                animationFrameId = null
                lastFrameTime = null
            }
        }

        const startCameraMovement = () => {
            if (animationFrameId === null)
                animationFrameId = window.requestAnimationFrame(moveCamera)
        }

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase()

            if (!MOVEMENT_KEYS.includes(key))
                return

            e.preventDefault()
            pressedKeys.add(key)
            startCameraMovement()
        }

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase()

            if (!MOVEMENT_KEYS.includes(key))
                return

            e.preventDefault()
            pressedKeys.delete(key)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)

            if (animationFrameId !== null)
                window.cancelAnimationFrame(animationFrameId)
        }
    }, [mapRef, enabled])
}