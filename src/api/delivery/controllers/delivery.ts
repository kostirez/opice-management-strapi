/**
 * delivery controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::delivery.delivery', ({strapi})  => ({

    generateDelivery: async (ctx) => {
        const { actionId } = ctx.params;
        const input = ctx.request.body;
        console.log("input123: ",input);
        // return strapi.service('api::batch.batch').generateSingleBatch(input.orderId, input.date);
    }
}));