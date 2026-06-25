export function blurTextInputOnEnter(event) {
    if (event.key !== 'Enter') {
        return
    }

    event.preventDefault()
    event.currentTarget.blur()
}

export const TEXT_INPUT_ENTER_BLUR_SLOT_PROPS = {
    htmlInput: {
        onKeyDown: blurTextInputOnEnter,
    },
}
