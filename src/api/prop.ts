import type { Prop } from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';

const propReq = {
    getProp(params: { propId: string }): Promise<{ json: Json<Prop>; params }> {
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
