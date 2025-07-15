/**
 *
 * @param {array} array
 * @param {*} item
 * @returns {boolean}
 */
function removeFromArray(array, item) {
    const { length } = array;
    for (let i = 0; i < length; ++i) {
        if (array[i] === item) {
            array.splice(i, 1);
            return true;
        }
    }
    return false;
}

/**
 *
 * @param {array} a
 * @param {array} b
 * @returns {boolean}
 */
function arraysMatch(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
    }
    return (
        a.length === b.length &&
        a.every(
            (element, index) =>
                JSON.stringify(element) === JSON.stringify(b[index])
        )
    );
}

/**
 *
 * @param {array} array
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {void}
 */
function moveArrayItem(array, fromIndex, toIndex) {
    if (!Array.isArray(array) || fromIndex === toIndex) {
        return;
    }
    if (fromIndex < 0 || fromIndex >= array.length) {
        return;
    }
    if (toIndex < 0 || toIndex >= array.length) {
        return;
    }
    const item = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, item);
}

export { removeFromArray, arraysMatch, moveArrayItem };
