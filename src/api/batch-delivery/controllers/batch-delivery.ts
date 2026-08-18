/**
 * batch-delivery controller
 */

import { factories } from '@strapi/strapi'
import dayjs from "dayjs";

export interface DeliveryOverview {
  customerName: string;
  orderId: number;
  state: "PENDING" | "PACKED" | "PLANED"
  itemsForDelivery: {
      recipeId: number,
      recipeName: string,
      amount: number,
      finishedPacking: boolean,
      unit: string,
    }[];
}

export interface BatchDeliveryDetail {
  customerName: string;
  orderId: number;
  state: "PENDING" | "PACKED" | "PLANED"
  itemsForDelivery: {
    recipeId: number,
    recipeName: string,
    amount: number,
    finishedPacking: boolean,
    unit: string,
  }[];
}

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


  async getOverview(ctx): Promise<{data: DeliveryOverview[]}> {

    const filters: any = {};
    filters.state = {
      $in: ['PENDING', 'PACKED'],
    };

    const unfinishedDeliveries = await strapi.entityService.findMany('api::batch-delivery.batch-delivery', {
      filters,
      populate: {
        expectedItems: {
          populate: ['recipe']
        },
        deliveredItems: {
          populate: ['recipe']
        },
        order: true
      },
    }) as any[];

    const todayPlanedDeliveries = await strapi.service('api::order.order').getDeliveryList(dayjs().format('YYYY-MM-DD'));

    const ret: DeliveryOverview[] = todayPlanedDeliveries.map(tpd => {
      const itemsForDelivery = tpd.itemsForDelivery.map(i => ({...i, finishedPacking: false}));
      return {...tpd, state: "PLANED", itemsForDelivery }
    });

    for (const del of unfinishedDeliveries) {
      if (!del.order) continue;
      
      const existing = ret.find(r => r.orderId === del.order.id);
      if (!existing) {
        const customer = await strapi.entityService.findOne('api::order.order', del.order.id, {
          populate: ['customer']
        }) as any;

        ret.push({
          customerName: customer?.customer?.name || customer?.customer?.officialName || 'Unknown',
          orderId: del.order.id,
          state: del.state,
          itemsForDelivery: (del.expectedItems || []).map(ei => {
            const delivered = del.deliveredItems?.find(di => di.recipe?.id === ei.recipe?.id);
            return {
              recipeId: ei.recipe?.id,
              recipeName: ei.recipe?.name,
              amount: ei.amount,
              unit: ei.unit,
              finishedPacking: delivered ? delivered.amount >= ei.amount : false
            };
          })
        });
      }
    }

    return { data: ret };
  },

  async getDetailById(ctx) {
    const { date } = ctx.query;
    const dayjsDate = dayjs(date as string);

    const filters: any = {};
    filters.deliveryDate = dayjsDate.format('YYYY-MM-DD');

    const entries = await strapi.entityService.findMany('api::batch-delivery.batch-delivery', {
      filters,
      populate: ['order'],
    });

    return entries
  },
}));
