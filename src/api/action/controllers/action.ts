/**
 * action controller
 */

import { factories } from '@strapi/strapi'
import {generateBatchesForDates} from "../../../helpers/generate";

export default factories.createCoreController('api::action.action', ({ strapi }) => ({
  async update(ctx) {
    const { id } = ctx.params;
    const input = ctx.request.body.data;

    // Get existing entity with nested relations
    const existing = await strapi.entityService.findOne('api::action.action', id, {
      populate: {
        plantBatch: {
          populate: {
            plant: true,
            strategy: true,
          },
        },
      },
    }) as any;

    if (!existing) {
      return ctx.notFound();
    }

    // Merge existing plantBatch with new input (preserve nested data)
    const mergedPlantBatch = {
      ...existing.plantBatch,
      ...(input.plantBatch || {})
    };

    // Merge all input data
    const mergedData = {
      ...input,
      plantBatch: mergedPlantBatch
    };

    const updated = await strapi.entityService.update('api::action.action', id, {
      data: mergedData
    });

    return this.transformResponse(updated);
  },

  fulfillAction: async (ctx) => {
      const {id} = ctx.params;
      const input = ctx.request.body;
    // const { timeInSeconds } = input;
    return strapi.service('api::action.action').fulfillAction(id, input.timeInSeconds);
  },

  generateOne: async (ctx) => {
    const { batchId } = ctx.params;
    const input = ctx.request.body.data;
  },

  generateActionsForBatch: async (ctx) => {
    const { batchId } = ctx.params;
    return strapi.service('api::action.action').generateActionsForBatch(batchId);
  },
}));
