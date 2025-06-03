const TokenKey = 'CloudData-Token';
class TokenStorage {
    constructor() {
        this.storage = {};
    }
    getItem(key) {
        return this.storage[key] || null;
    }
    setItem(key, value) {
        this.storage[key] = value;
    }
    removeItem(key) {
        delete this.storage[key];
    }
}
const tokenStorage = new TokenStorage();
export function getToken() {
    return tokenStorage.getItem(TokenKey);
}

export function setToken(token) {
    return tokenStorage.setItem(TokenKey, token);
}

export function removeToken() {
    return tokenStorage.removeItem(TokenKey);
}

export function getTokenExpiration() {
    try {
        const token = getToken();
        if (!token) {
            return null; // 如果没有 Token，返回 null
        }
        // 解析 JWT Token 的 payload 部分
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(
            payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
        );
        const payload = JSON.parse(payloadJson);
        return payload.exp; // 返回 Unix 时间戳（秒）
    } catch (error) {
        console.error('解析 Token 失败:', error);
        return null;
    }
}
