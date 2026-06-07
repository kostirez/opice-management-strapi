/**
 * batch-delivery controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::batch-delivery.batch-delivery', ({ strapi }) => ({
  async createMany(ctx) {
    const { data } = ctx.request.body;
    if (!Array.isArray(data)) {
      return ctx.badRequest('Data must be an array');
    }

    const results = [];
    for (const item of data) {
      try {
        const entry = await strapi.entityService.create('api::batch-delivery.batch-delivery', {
          data: item,
        });
        results.push(entry);
      } catch (error) {
        results.push({ error: error.message, item });
      }
    }

    return { data: results };
  },
}));
