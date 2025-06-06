import request from '../../utils/requests';

export function login(data) {
    return request({
        url: '/login',
        method: 'POST',
        data
    });
}
