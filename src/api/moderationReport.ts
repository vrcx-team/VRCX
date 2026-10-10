import type {
    GetModerationReports,
    ModerationReport,
    PaginatedModerationReportList,
    SubmitModerationReportRequest,
    SuccessFlag
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';

const moderationReportReq = {
    getModerationReports(
        params: GetModerationReports['query']
    ): Promise<{ json: Json<PaginatedModerationReportList>; params: GetModerationReports['query'] }> {
        return request('moderationReports', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    submitModerationReport(
        params: SubmitModerationReportRequest
    ): Promise<{ json: Json<ModerationReport>; params: SubmitModerationReportRequest }> {
        return request('moderationReports', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deleteModerationReport(params: {
        moderationReportId: string;
    }): Promise<{ json: Json<SuccessFlag>; params: { moderationReportId: string } }> {
        return request(`moderationReports/${params.moderationReportId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default moderationReportReq;
