export async function executeWithBackoff(fn, options = {}) {
    const {
        maxRetries = 5,
        baseDelay = 1000,
        shouldRetry = () => true
    } = options;

    async function attempt(remaining) {
        try {
            return await fn();
        } catch (err) {
            if (remaining <= 0 || !shouldRetry(err)) {
                throw err;
            }
            const delay =
                baseDelay *
                Math.pow(2, (options.maxRetries || maxRetries) - remaining);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return attempt(remaining - 1);
        }
    }

    return attempt(maxRetries);
}
