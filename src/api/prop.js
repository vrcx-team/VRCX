import { request } from '../service/request';

const propReq = {
    /**
     * @param {{ propId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getProp(params) {
        return request(`props/${params.propId}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default propReq;
