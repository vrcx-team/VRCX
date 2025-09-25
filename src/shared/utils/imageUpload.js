import { ElMessage } from 'element-plus';

function resolveMessage(message) {
    if (typeof message === 'function') {
        return message();
    }
    return message;
}

function getInputElement(selector) {
    if (!selector) {
        return null;
    }
    if (typeof selector === 'function') {
        return selector();
    }
    if (typeof selector === 'string') {
        return document.querySelector(selector);
    }
    return selector;
}

export function handleImageUploadInput(event, options = {}) {
    const {
        inputSelector,
        maxSize = 100000000,
        acceptPattern = /image.*/,
        tooLargeMessage,
        invalidTypeMessage,
        onClear
    } = options;

    const clearInput = () => {
        onClear?.();
        const input = getInputElement(inputSelector);
        if (input) {
            input.value = '';
        }
    };

    const files = event?.target?.files || event?.dataTransfer?.files;
    if (!files || files.length === 0) {
        clearInput();
        return { file: null, clearInput };
    }

    const file = files[0];
    if (file.size >= maxSize) {
        if (tooLargeMessage) {
            ElMessage({ message: resolveMessage(tooLargeMessage), type: 'error' });
        }
        clearInput();
        return { file: null, clearInput };
    }

    let acceptRegex = null;
    if (acceptPattern) {
        acceptRegex = acceptPattern instanceof RegExp ? acceptPattern : new RegExp(acceptPattern);
    }

    if (acceptRegex && !acceptRegex.test(file.type)) {
        if (invalidTypeMessage) {
            ElMessage({ message: resolveMessage(invalidTypeMessage), type: 'error' });
        }
        clearInput();
        return { file: null, clearInput };
    }

    return { file, clearInput };
}
