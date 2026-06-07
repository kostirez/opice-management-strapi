/**
 * order controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async deliveryList(ctx) {
    const { date } = ctx.query;
    
    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
    }

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = days[targetDate.getDay()];

    const orders = await strapi.entityService.findMany('api::order.order', {
      filters: {
        active: true,
        deliveryTimes: {
          daysInWeek: {
            day: dayOfWeek as any
          }
        }
      },
      populate: {
        customer: true,
        itemsForDelivery: {
          populate: ['recipe']
        },
        deliveryTimes: {
          populate: ['daysInWeek']
        }
      }
    });

    return orders.map((order: any) => ({
      customerName: order.customer?.name || order.customer?.officialName,
      orderId: order.id,
      itemsForDelivery: (order.itemsForDelivery || []).map((item: any) => ({
        recipeId: item.recipe?.id,
        recipeName: item.recipe?.name,
        amount: item.amount,
        unit: item.unit
      }))
    }));
  }
}));
