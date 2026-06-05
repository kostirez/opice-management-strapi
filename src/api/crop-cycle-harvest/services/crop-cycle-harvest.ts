/**
 * crop-cycle-harvest service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::crop-cycle-harvest.crop-cycle-harvest', ({ strapi }) => ({
  async create(params) {
    const { data } = params;

    // If batch_harvest is not provided, throw error
    if (!data.batch_harvest) {
      throw new Error('Batch harvest must be specified');
    }

    console.log('Creating crop cycle harvest with data:', data);

    const result = await super.create(params);


    if (data.crop_cycle) {
      const cropCycle = await strapi.entityService.findOne('api::crop-cycle.crop-cycle', data.crop_cycle, {
        populate: ['tray'],
      }) as any;

      await strapi.entityService.update('api::crop-cycle.crop-cycle', data.crop_cycle, {
        data: {
          state: 'HARVESTED',
        },
      });

      if (cropCycle?.tray) {
        await strapi.entityService.update('api::tray.tray', cropCycle.tray.id, {
          data: {
            state: 'Washing',
            placeCode: 'DEPOT',
          },
        });
      }
    }

    if (data.batch_harvest) {
      console.log('Syncing batch harvest:', data.batch_harvest);
      // Explicitly update the harvest to ensure relation to batch is saved
      // Sometimes super.create might have issues with relations if they are not properly formatted
      const afterSync = await strapi.entityService.update('api::crop-cycle-harvest.crop-cycle-harvest', result.id, {
        data: {
          batch_harvest: data.batch_harvest,
        },
      });
      console.log('Synced batch harvest:', afterSync);
      await this.syncBatchHarvest(data.batch_harvest, result.id);
    }

    return result;
  },

  async update(id, params) {
    const { data } = params;

    // Get old state to check if batch_harvest changed
    const oldEntry: any = await strapi.entityService.findOne('api::crop-cycle-harvest.crop-cycle-harvest', id, {
      populate: ['batch_harvest'],
    });

    const result = await super.update(id, params);

    // Sync old batch if it changed
    if (oldEntry.batch_harvest && data.batch_harvest && oldEntry.batch_harvest.id !== data.batch_harvest) {
      await this.syncBatchHarvest(oldEntry.batch_harvest.id, id, true);
    }

    // Sync new (or current) batch
    const batchId = data.batch_harvest || (oldEntry.batch_harvest ? oldEntry.batch_harvest.id : null);
    if (batchId) {
      await this.syncBatchHarvest(batchId, id);
    }

    return result;
  },

  async delete(id, params) {
    const oldEntry: any = await strapi.entityService.findOne('api::crop-cycle-harvest.crop-cycle-harvest', id, {
      populate: ['batch_harvest'],
    });

    const result = await super.delete(id, params);

    if (oldEntry.batch_harvest) {
      await this.syncBatchHarvest(oldEntry.batch_harvest.id, id, true);
    }

    return result;
  },

  async syncBatchHarvest(batchId, currentHarvestId = null, isRemoving = false) {
    const batch: any = await strapi.entityService.findOne('api::batch-harvest.batch-harvest', batchId, {
      populate: {
        crop_cycle_harvests: {
          populate: {
            crop_cycle: {
              populate: ['plant'],
            },
          },
        },
      },
    });

    console.log('Syncing batch harvest:', batch);
    if (!batch) return;

    const plantTotals = {};

    const harvests = [...(batch.crop_cycle_harvests || [])];

    if (currentHarvestId && !isRemoving) {
      const exists = harvests.find(h => h.id === currentHarvestId);
      console.log('Current harvest exists:', exists);
      if (!exists) {
          console.log('Current harvest not found in harvests, fetching...');
        const currentHarvest = await strapi.entityService.findOne('api::crop-cycle-harvest.crop-cycle-harvest', currentHarvestId, {
          populate: {
            crop_cycle: {
              populate: ['plant'],
            },
          },
        });
        console.log('Current harvest:', currentHarvest);
        if (currentHarvest) {
          harvests.push(currentHarvest);
        }
      }
    } else if (currentHarvestId && isRemoving) {
      const index = harvests.findIndex(h => h.id === currentHarvestId);
      if (index !== -1) {
        harvests.splice(index, 1);
      }
    }

    console.log('Harvests:', harvests);

    harvests.forEach((harvest) => {
      const plantId = harvest.crop_cycle?.plant?.id;
      if (!plantId) return;

      if (!plantTotals[plantId]) {
        plantTotals[plantId] = {
          plant: plantId,
          amount: 0,
          unit: 'GRAM',
        };
      }
      plantTotals[plantId].amount += (harvest.weight || 0);
    });

    const harvestedCrops = Object.values(plantTotals);
    console.log('Harvested crops:', harvestedCrops);

    await strapi.entityService.update('api::batch-harvest.batch-harvest', batchId, {
      data: {
        harvestedCrops,
      },
    });
  },
}));
