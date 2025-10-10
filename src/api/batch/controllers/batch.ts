/**
 * batch controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::batch.batch', ({strapi}) => ({
    fulfillBatch: async (ctx) => {
        const { batchId } = ctx.params;
        const input = ctx.request.body.data;
    },

    // generateForOrder: async (ctx) => {
    //     const { orderId } = ctx.params;
    //     const input = ctx.request.body.data;
    //     const dates =
    // },

    generateSingleBatch: async (ctx) => {
        const { id } = ctx.params;
        const input = ctx.request.body;
        return strapi.service('api::batch.batch').generateSingleBatch(input.orderId, input.date);
    }

}));
