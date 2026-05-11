import {useEffect} from 'react'
import {
    getKeyboardCameraActionForKey, pressedKeysMatchBinding, useControlBindings,
} from '../contexts/ControlBindingsContext'

export function useKeyboardCameraControls(mapRef, enabled) {
    const {controlBindings} = useControlBindings()
    const keyboardCameraBindings = controlBindings.keyboardCamera

    useEffect(() => {
        if (!enabled) return

        const pressedKeys = new Set()
        let animationFrameId = null
        let lastFrameTime = null

        const moveCamera = (timestamp) => {
            if (!mapRef.current) {
                animationFrameId = null
                return
            }

            if (lastFrameTime === null) lastFrameTime = timestamp

            const deltaSeconds = (timestamp - lastFrameTime) / 1000
            lastFrameTime = timestamp

            const isSlowPan = pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panSpeedModifier,)

            const panSpeed = isSlowPan ? keyboardCameraBindings.regularPanSpeed * keyboardCameraBindings.panSpeedMultiplier : keyboardCameraBindings.regularPanSpeed

            let x = 0
            let y = 0

            if (pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panUp)) y -= 1
            if (pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panLeft)) x -= 1
            if (pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panDown)) y += 1
            if (pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panRight)) x += 1

            if (x !== 0 || y !== 0) {
                const length = Math.sqrt(x * x + y * y)

                mapRef.current.panBy([(x / length) * panSpeed * deltaSeconds, (y / length) * panSpeed * deltaSeconds,], {duration: 0})
            }

            const hasMovementKey = pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panUp) || pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panLeft) || pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panDown) || pressedKeysMatchBinding(pressedKeys, keyboardCameraBindings.panRight)

            if (hasMovementKey) {
                animationFrameId = window.requestAnimationFrame(moveCamera)
            } else {
                animationFrameId = null
                lastFrameTime = null
            }
        }

        const startCameraMovement = () => {
            if (animationFrameId === null) animationFrameId = window.requestAnimationFrame(moveCamera)
        }

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase()
            const action = getKeyboardCameraActionForKey(key, keyboardCameraBindings)

            if (!action) return

            e.preventDefault()
            pressedKeys.add(key)
            startCameraMovement()
        }

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase()
            const action = getKeyboardCameraActionForKey(key, keyboardCameraBindings)

            if (!action) return

            e.preventDefault()
            pressedKeys.delete(key)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)

            if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
        }
    }, [mapRef, enabled, keyboardCameraBindings])
}