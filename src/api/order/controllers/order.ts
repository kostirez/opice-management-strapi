/**
 * order controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async deliveryList(ctx) {
    const { date } = ctx.query;
    return await strapi.service('api::order.order').getDeliveryList(date);
  }
}));
