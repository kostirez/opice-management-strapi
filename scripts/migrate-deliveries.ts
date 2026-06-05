import dayjs from 'dayjs';

/**
 * Migration script to transfer "delivery" actions to batch-deliveries.
 * 
 * Usage:
 * 1. Open strapi console: `npm run strapi console`
 * 2. Copy and paste the content of this script (after transpile or just the function)
 *    OR call it from a temporary controller/route.
 */

declare const strapi: any;

export async function migrateActionsToDeliveries({ 
  startDate, 
  endDate, 
  orderId 
}: { 
  startDate?: string, 
  endDate?: string, 
  orderId?: number | string 
}) {
  console.log('Starting migration...');

  // 1. Find the "delivery" action type
  const actionTypes = await strapi.entityService.findMany('api::action-type.action-type', {
    filters: { name: 'delivery' },
  });

  if (actionTypes.length === 0) {
    console.error('Action type "delivery" not found.');
    return;
  }

  const deliveryTypeId = actionTypes[0].id;

  // 2. Build filters for actions
  const filters: any = {
    action_type: deliveryTypeId,
    state: 'done', // assuming we only want to transfer finished deliveries
  };

  if (startDate || endDate) {
    filters.timestamp = {};
    if (startDate) filters.timestamp.$gte = dayjs(startDate).startOf('day').toISOString();
    if (endDate) filters.timestamp.$lte = dayjs(endDate).endOf('day').toISOString();
  }

  if (orderId) {
    filters.batch = {
      order: orderId
    };
  }

  console.log('Filters:', filters);

  // 3. Find actions
  const actions = await strapi.entityService.findMany('api::action.action', {
    filters,
    populate: {
      batch: {
        populate: ['order']
      },
      plantBatch: {
        populate: ['plant']
      }
    }
  }) as any[];

  console.log(`Found ${actions.map(a => a.timestamp)} actions to migrate.`);

  let migratedCount = 0;

  for (const action of actions) {
    try {
      const order = action.batch?.order;
      if (!order) {
        console.warn(`Action ${action.id} has no associated order via batch. Skipping.`);
        continue;
      }

      // 4. Get order for expectedItems
      const fullOrder = await strapi.entityService.findOne('api::order.order', order.id, {
        populate: {
          plantsToGrow: {
            populate: ['plant']
          }
        }
      }) as any;

      const expectedItems = fullOrder.plantsToGrow?.map((item: any) => ({
        plant: item.plant?.id || item.plant,
        amount: item.amount,
        unit: "GRAM"
      })) || [];

      // 5. Prepare deliveredItems from action.plantBatch
      // The user mentioned deliveredItems should be filled. 
      // In Action, we have plantBatch (single component).
      const deliveredItems = [];
      if (action.plantBatch) {
        deliveredItems.push({
          plant: action.plantBatch.plant?.id || action.plantBatch.plant,
          amount: action.plantBatch.amount,
          // unit is missing in action.plantBatch based on schema, but crop-batch component usually has it.
          // We might need to guess or take it from order if it's the same plant.
          unit: 'GRAM'
        });
      }

      // 6. Create Batch Delivery
      console.log(`Creating delivery for action ${action.id} (Order: ${order.id}, Date: ${action.timestamp})`);
      await strapi.entityService.create('api::batch-delivery.batch-delivery', {
        data: {
          deliveriedAt: action.timestamp,
          state: 'DELIVERED',
          order: order.id,
          expectedItems: expectedItems,
          deliveredItems: deliveredItems,

        }
      });

      migratedCount++;
    } catch (err) {
      console.error(`Failed to migrate action ${action.id}:`, err);
    }
  }

  console.log(`Migration finished. Migrated ${migratedCount} actions.`);
}
