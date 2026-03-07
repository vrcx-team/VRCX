import security, {
    hexToUint8Array,
    stdAESKey,
    uint8ArrayToHex
} from '../security.js';

describe('hexToUint8Array', () => {
    test('converts hex string to Uint8Array', () => {
        const result = hexToUint8Array('0a1bff');
        expect(result).toEqual(new Uint8Array([0x0a, 0x1b, 0xff]));
    });

    test('converts empty-ish input', () => {
        const result = hexToUint8Array('00');
        expect(result).toEqual(new Uint8Array([0]));
    });

    test('returns null for empty string', () => {
        expect(hexToUint8Array('')).toBeNull();
    });
});

describe('uint8ArrayToHex', () => {
    test('converts Uint8Array to hex string', () => {
        const result = uint8ArrayToHex(new Uint8Array([0x0a, 0x1b, 0xff]));
        expect(result).toBe('0a1bff');
    });

    test('pads single-digit hex values', () => {
        const result = uint8ArrayToHex(new Uint8Array([0, 1, 2]));
        expect(result).toBe('000102');
    });

    test('converts empty array', () => {
        expect(uint8ArrayToHex(new Uint8Array([]))).toBe('');
    });
});

describe('hex round-trip', () => {
    test('uint8Array → hex → uint8Array preserves data', () => {
        const original = new Uint8Array([0, 127, 255, 42, 1]);
        const hex = uint8ArrayToHex(original);
        const restored = hexToUint8Array(hex);
        expect(restored).toEqual(original);
    });
});

describe('stdAESKey', () => {
    test('pads short key to 32 bytes', () => {
        const result = stdAESKey('abc');
        expect(result.length).toBe(32);
        // First 3 bytes should be 'abc'
        expect(result[0]).toBe('a'.charCodeAt(0));
        expect(result[1]).toBe('b'.charCodeAt(0));
        expect(result[2]).toBe('c'.charCodeAt(0));
    });

    test('truncates long key to 32 bytes', () => {
        const longKey = 'a'.repeat(64);
        const result = stdAESKey(longKey);
        expect(result.length).toBe(32);
    });

    test('32-byte key stays unchanged', () => {
        const key = 'abcdefghijklmnopqrstuvwxyz012345'; // exactly 32 chars
        const result = stdAESKey(key);
        expect(result.length).toBe(32);
        const expected = new TextEncoder().encode(key);
        expect(result).toEqual(expected);
    });
});

describe('encrypt / decrypt round-trip', () => {
    test('encrypts and decrypts plaintext correctly', async () => {
        const plaintext = 'Hello, VRCX!';
        const key = 'my-secret-key';

        const ciphertext = await security.encrypt(plaintext, key);
        expect(typeof ciphertext).toBe('string');
        expect(ciphertext.length).toBeGreaterThan(0);

        const decrypted = await security.decrypt(ciphertext, key);
        expect(decrypted).toBe(plaintext);
    });

    test('different keys produce different ciphertext', async () => {
        const plaintext = 'secret data';
        const ct1 = await security.encrypt(plaintext, 'key1');
        const ct2 = await security.encrypt(plaintext, 'key2');
        expect(ct1).not.toBe(ct2);
    });

    test('decrypt returns empty string for empty input', async () => {
        const result = await security.decrypt('', 'key');
        expect(result).toBe('');
    });
});
