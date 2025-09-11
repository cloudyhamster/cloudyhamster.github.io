export function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    debounced.cancel = function() {
        clearTimeout(timeout);
    };
    return debounced;
}