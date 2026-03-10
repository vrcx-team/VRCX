import { isRpcWorld } from '../world';

// Mock transitive deps
vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
    default: { push: vi.fn(), currentRoute: { value: {} } }
}));

describe('World Utils', () => {
    describe('isRpcWorld', () => {
        test('returns true for a known RPC world', () => {
            expect(
                isRpcWorld(
                    'wrld_f20326da-f1ac-45fc-a062-609723b097b1:12345~region(us)'
                )
            ).toBe(true);
        });

        test('returns false for a random world', () => {
            expect(
                isRpcWorld('wrld_00000000-0000-0000-0000-000000000000:12345')
            ).toBe(false);
        });

        test('returns false for offline location', () => {
            expect(isRpcWorld('offline')).toBe(false);
        });

        test('returns false for private location', () => {
            expect(isRpcWorld('private')).toBe(false);
        });

        test('returns false for empty string', () => {
            expect(isRpcWorld('')).toBe(false);
        });
    });
});
