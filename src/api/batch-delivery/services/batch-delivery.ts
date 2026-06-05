/**
 * batch-delivery service
 */

import { factories } from '@strapi/strapi';

const populateExpectedItems = async (strapi, data) => {
  if (data.order && (!data.expectedItems || data.expectedItems.length === 0)) {
    const order = await strapi.entityService.findOne('api::order.order', data.order, {
      populate: {
        itemsForDelivery: {
          populate: ['recipe'],
        },
      },
    });

    console.log("order: ", order);

    if (order && order.itemsForDelivery) {
      console.log("order.itemsForDelivery: ", order.itemsForDelivery);
      data.expectedItems = order.itemsForDelivery.map((item) => {
        console.log("item: ", item);
        return {
          recipe: item.recipe?.id || item.recipe,
          amount: item.amount,
          unit: item.unit,
        }
      });
    }
  }
};

export default factories.createCoreService('api::batch-delivery.batch-delivery', ({ strapi }) => ({
  async create(params) {
    await populateExpectedItems(strapi, params.data);
    return await super.create(params);
  },

  async update(id, params) {
    await populateExpectedItems(strapi, params.data);
    return await super.update(id, params);
  },
}));
