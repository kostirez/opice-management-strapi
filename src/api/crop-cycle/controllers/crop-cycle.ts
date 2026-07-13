/**
 * crop-cycle controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::crop-cycle.crop-cycle', ({ strapi }) => {
  const generateCropCycle = async (item: any) => {
    const { plantId, tray: trayCode, startDate } = item;

    if (!plantId || !trayCode || !startDate) {
      throw new Error('plantId, tray, and startDate are required');
    }

    const plant = await strapi.entityService.findOne('api::plant.plant', plantId);
    if (!plant) {
      throw new Error(`Plant with ID ${plantId} not found`);
    }

    const trays = await strapi.entityService.findMany('api::tray.tray', {
      filters: { code: trayCode },
    });

    if (!trays || trays.length === 0) {
      throw new Error(`Tray with code ${trayCode} not found`);
    }
    const tray = trays[0];

    const start = new Date(startDate);
    const seedingDay = start.toISOString().split('T')[0];

    const moveToLightDate = new Date(start);
    moveToLightDate.setDate(start.getDate() + (plant.germinationTime || 0));
    const moveToLightDay = moveToLightDate.toISOString().split('T')[0];

    const harvestDate = new Date(start);
    harvestDate.setDate(start.getDate() + (plant.timeToGrow || 0));
    const harvestDay = harvestDate.toISOString().split('T')[0];

    const result = await strapi.entityService.create('api::crop-cycle.crop-cycle', {
      data: {
        seedingDay,
        moveToLightDay,
        harvestDay,
        state: 'PENDING',
        plant: plantId,
        tray: tray.id,
        crop_cycle_harvest: null,
      },
    });

    await strapi.entityService.update('api::tray.tray', tray.id, {
      data: {
        state: 'InUse',
      },
    });

    return result;
  };

  return {
    async customList(ctx) {
      const { state, plant, seedingDay, moveToLightDay, harvestDay } = ctx.query;

      const filters: any = {};
      if (state) filters.state = state;
      if (plant) filters.plant = plant;
      if (seedingDay) filters.seedingDay = seedingDay;
      if (moveToLightDay) filters.moveToLightDay = moveToLightDay;
      if (harvestDay) filters.harvestDay = harvestDay;

      const entries = await strapi.entityService.findMany('api::crop-cycle.crop-cycle', {
        filters,
        populate: ['plant', 'crop_cycle_harvest', 'tray'],
      });

      return entries.map((entry: any) => ({
        id: entry.id,
        seedingDay: entry.seedingDay,
        moveToLightDay: entry.moveToLightDay,
        harvestDay: entry.harvestDay,
        plantName: entry.plant?.name,
        state: entry.state,
        harvestId: entry.crop_cycle_harvest?.id,
        trayCode: entry.tray?.code,
        trayPlace: entry.tray?.placeCode,
      }));
    },

    async create(ctx) {
      const { data } = ctx.request.body;
      const result = await generateCropCycle(data);
      return result;
    },

    async createMany(ctx) {
      const { data } = ctx.request.body;
      if (!Array.isArray(data)) {
        return ctx.badRequest('Data must be an array');
      }

      const results = [];
      for (const item of data) {
        const result = await generateCropCycle(item);
        results.push(result);
      }

      return results;
    },

    async move(ctx) {
      const { id } = ctx.params;
      const { state, placeCode } = ctx.request.body.data;

      const cropCycle = await strapi.entityService.findOne('api::crop-cycle.crop-cycle', id, {
        populate: ['tray'],
      }) as any;

      if (!cropCycle) {
        return ctx.notFound('Crop cycle not found');
      }

      const updateData: any = {};
      if (state) updateData.state = state;

      const updatedCropCycle = await strapi.entityService.update('api::crop-cycle.crop-cycle', id, {
        data: updateData,
      });

      if (placeCode && cropCycle.tray) {
        await strapi.entityService.update('api::tray.tray', cropCycle.tray.id, {
          data: { placeCode },
        });
      }

      return updatedCropCycle;
    },
  };
});
