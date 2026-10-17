import type { Avatar } from 'vrchat';
import type { Json, MarketplaceAvatarSearchParams } from '../types/vrcx';
import { request } from '../services/request';

type MarketplaceAvatarSearchResponse = {
    hasNext: boolean;
    totalCount: number;
    results: Json<Avatar>[];
};

const marketplaceReq = {
    searchAvatars(
        params: MarketplaceAvatarSearchParams
    ): Promise<{ json: MarketplaceAvatarSearchResponse; params: MarketplaceAvatarSearchParams }> {
        const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
        return request('avatars', {
            method: 'GET',
            params: query
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default marketplaceReq;
