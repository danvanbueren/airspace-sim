const FOCUSABLE_SELECTOR = 'input, textarea, select, [role="combobox"]'

export function blurFocusedElementWithin(container) {
    if (!container) {
        return
    }

    const {activeElement} = document

    if (activeElement instanceof HTMLElement && container.contains(activeElement)) {
        activeElement.blur()
    }

    container.querySelectorAll(FOCUSABLE_SELECTOR).forEach((element) => {
        if (element instanceof HTMLElement) {
            element.blur()
        }
    })
}
