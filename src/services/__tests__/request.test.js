// Mock router to avoid transitive i18n.global error from columns.jsx
vi.mock('../../plugins/router.js', () => ({
    router: { beforeEach: vi.fn(), push: vi.fn() },
    initRouter: vi.fn()
}));

import {
    buildRequestInit,
    parseResponse,
    processBulk,
    shouldIgnoreError
} from '../request.js';

describe('buildRequestInit', () => {
    test('builds GET request with default method', () => {
        const init = buildRequestInit('users/usr_123');
        expect(init.method).toBe('GET');
        expect(init.url).toContain('users/usr_123');
    });

    test('serializes GET params into URL search params', () => {
        const init = buildRequestInit('users', {
            params: { n: 50, offset: 0 }
        });
        expect(init.url).toContain('n=50');
        expect(init.url).toContain('offset=0');
    });

    test('does not set body for GET requests', () => {
        const init = buildRequestInit('users', {
            params: { n: 50 }
        });
        expect(init.body).toBeUndefined();
    });

    test('sets JSON content-type and body for POST', () => {
        const init = buildRequestInit('auth/login', {
            method: 'POST',
            params: { username: 'test' }
        });
        expect(init.headers['Content-Type']).toBe(
            'application/json;charset=utf-8'
        );
        expect(init.body).toBe(JSON.stringify({ username: 'test' }));
    });

    test('sets empty body when POST has no params', () => {
        const init = buildRequestInit('auth/logout', { method: 'POST' });
        expect(init.body).toBe('{}');
    });

    test('preserves custom headers in POST', () => {
        const init = buildRequestInit('users', {
            method: 'PUT',
            headers: { 'X-Custom': 'value' },
            params: { a: 1 }
        });
        expect(init.headers['Content-Type']).toBe(
            'application/json;charset=utf-8'
        );
        expect(init.headers['X-Custom']).toBe('value');
    });

    test('skips body/headers for upload requests', () => {
        const init = buildRequestInit('file/upload', {
            method: 'PUT',
            uploadImage: true,
            params: { something: 1 }
        });
        expect(init.body).toBeUndefined();
        expect(init.headers).toBeUndefined();
    });

    test('skips body/headers for uploadFilePUT', () => {
        const init = buildRequestInit('file/upload', {
            method: 'PUT',
            uploadFilePUT: true
        });
        expect(init.body).toBeUndefined();
    });

    test('skips body/headers for uploadImageLegacy', () => {
        const init = buildRequestInit('file/upload', {
            method: 'POST',
            uploadImageLegacy: true
        });
        expect(init.body).toBeUndefined();
    });

    test('passes through extra options', () => {
        const init = buildRequestInit('test', {
            method: 'DELETE',
            inviteId: 'inv_123'
        });
        expect(init.method).toBe('DELETE');
        expect(init.inviteId).toBe('inv_123');
    });
});

describe('parseResponse', () => {
    test('returns response unchanged when no data', () => {
        const response = { status: 200 };
        expect(parseResponse(response)).toEqual({ status: 200 });
    });

    test('parses valid JSON data', () => {
        const response = {
            status: 200,
            data: JSON.stringify({ name: 'test' })
        };
        const result = parseResponse(response);
        expect(result.data).toEqual({ name: 'test' });
        expect(result.hasApiError).toBeUndefined();
        expect(result.parseError).toBeUndefined();
    });

    test('detects API error in response data', () => {
        const response = {
            status: 404,
            data: JSON.stringify({
                error: { status_code: 404, message: 'Not found' }
            })
        };
        const result = parseResponse(response);
        expect(result.hasApiError).toBe(true);
        expect(result.data.error.message).toBe('Not found');
    });

    test('flags parse error for invalid JSON', () => {
        const response = { status: 200, data: 'not valid json{{{' };
        const result = parseResponse(response);
        expect(result.parseError).toBe(true);
        expect(result.status).toBe(200);
    });

    test('handles empty string data', () => {
        const response = { status: 200, data: '' };
        const result = parseResponse(response);
        // empty string is falsy, so treated as no data
        expect(result).toEqual({ status: 200, data: '' });
    });

    test('handles null data', () => {
        const response = { status: 200, data: null };
        const result = parseResponse(response);
        expect(result).toEqual({ status: 200, data: null });
    });
});

describe('shouldIgnoreError', () => {
    test.each([
        [404, 'users/usr_123'],
        [404, 'worlds/wrld_123'],
        [404, 'avatars/avtr_123'],
        [404, 'groups/grp_123'],
        [404, 'file/file_123'],
        [-1, 'users/usr_123']
    ])('ignores %i for single-segment resource %s', (code, endpoint) => {
        expect(shouldIgnoreError(code, endpoint)).toBe(true);
    });

    test('does NOT ignore nested resource paths', () => {
        expect(shouldIgnoreError(404, 'users/usr_123/friends')).toBe(false);
    });

    test('does NOT ignore 403 for resource lookups', () => {
        expect(shouldIgnoreError(403, 'users/usr_123')).toBe(false);
    });

    test.each([403, 404, -1])('ignores %i for instances/ endpoints', (code) => {
        expect(shouldIgnoreError(code, 'instances/wrld_123:456')).toBe(true);
    });

    test('ignores any code for analysis/ endpoints', () => {
        expect(shouldIgnoreError(500, 'analysis/something')).toBe(true);
        expect(shouldIgnoreError(200, 'analysis/data')).toBe(true);
    });

    test.each([403, -1])('ignores %i for /mutuals endpoints', (code) => {
        expect(shouldIgnoreError(code, 'users/usr_123/mutuals')).toBe(true);
    });

    test('does NOT ignore 404 for /mutuals', () => {
        expect(shouldIgnoreError(404, 'users/usr_123/mutuals')).toBe(false);
    });

    test('returns false for unmatched patterns', () => {
        expect(shouldIgnoreError(500, 'auth/login')).toBe(false);
        expect(shouldIgnoreError(200, 'config')).toBe(false);
    });

    test('handles undefined endpoint', () => {
        expect(shouldIgnoreError(404, undefined)).toBe(false);
    });
});

describe('processBulk', () => {
    test('fetches all pages until empty batch', async () => {
        const pages = [{ json: [1, 2, 3] }, { json: [4, 5] }, { json: [] }];
        let call = 0;
        const fn = vi.fn(() => Promise.resolve(pages[call++]));
        const handle = vi.fn();
        const done = vi.fn();

        await processBulk({ fn, params: { n: 3 }, handle, done });

        expect(fn).toHaveBeenCalledTimes(3);
        expect(handle).toHaveBeenCalledTimes(3);
        expect(done).toHaveBeenCalledWith(true);
    });

    test('stops when N > 0 limit is reached', async () => {
        const fn = vi.fn(() => Promise.resolve({ json: [1, 2, 3] }));
        const done = vi.fn();

        await processBulk({ fn, params: { n: 3 }, N: 5, done });

        expect(fn).toHaveBeenCalledTimes(2);
        expect(done).toHaveBeenCalledWith(true);
    });

    test('stops when N = 0 and batch < pageSize', async () => {
        const pages = [{ json: [1, 2, 3] }, { json: [4] }];
        let call = 0;
        const fn = vi.fn(() => Promise.resolve(pages[call++]));
        const done = vi.fn();

        await processBulk({ fn, params: { n: 3 }, N: 0, done });

        expect(fn).toHaveBeenCalledTimes(2);
        expect(done).toHaveBeenCalledWith(true);
    });

    test('stops when hasNext is false', async () => {
        const fn = vi.fn(() =>
            Promise.resolve({ json: [1, 2, 3], hasNext: false })
        );
        const done = vi.fn();

        await processBulk({ fn, params: { n: 3 }, N: -1, done });

        expect(fn).toHaveBeenCalledTimes(1);
        expect(done).toHaveBeenCalledWith(true);
    });

    test('supports result.results array format', async () => {
        const pages = [{ results: [1, 2] }, { results: [] }];
        let call = 0;
        const fn = vi.fn(() => Promise.resolve(pages[call++]));
        const done = vi.fn();

        await processBulk({ fn, params: { n: 5 }, done });

        expect(fn).toHaveBeenCalledTimes(2);
        expect(done).toHaveBeenCalledWith(true);
    });

    test('calls done(false) when fn throws', async () => {
        const fn = vi.fn(() => Promise.reject(new Error('network error')));
        const done = vi.fn();

        await processBulk({ fn, params: { n: 5 }, done });

        expect(done).toHaveBeenCalledWith(false);
    });

    test('increments offset correctly', async () => {
        const pages = [{ json: [1, 2, 3] }, { json: [4, 5] }, { json: [] }];
        let call = 0;
        const offsets = [];
        const fn = vi.fn((params) => {
            offsets.push(params.offset);
            const result = pages[call++];
            return Promise.resolve(result);
        });

        await processBulk({ fn, params: { n: 3 } });

        expect(offsets).toEqual([0, 3, 5]);
    });

    test('returns early if fn is not a function', async () => {
        const done = vi.fn();
        await processBulk({ fn: null, done });
        expect(done).not.toHaveBeenCalled();
    });

    test('uses custom limitParam', async () => {
        const pages = [{ json: [1, 2] }, { json: [1] }];
        let call = 0;
        const fn = vi.fn(() => Promise.resolve(pages[call++]));
        const done = vi.fn();

        await processBulk({
            fn,
            params: { limit: 2 },
            limitParam: 'limit',
            N: 0,
            done
        });

        expect(fn).toHaveBeenCalledTimes(2);
        expect(done).toHaveBeenCalledWith(true);
    });
});
