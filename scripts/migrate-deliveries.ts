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
  
  // 1b. Fetch recipes for mapping
  const recipes = await strapi.entityService.findMany('api::recipe.recipe');
  const plants = await strapi.entityService.findMany('api::plant.plant');

  const plantToRecipeMap: Record<number, number> = {};
  for (const plant of plants) {
    const recipe = recipes.find((r: any) => r.code === plant.code);
    if (recipe) {
      console.log(`Mapping plant ${plant.code} to recipe ${recipe.code}`);
      plantToRecipeMap[plant.id] = recipe.id;
    }
  }

  console.log('Recipe mapping completed:', Object.keys(plantToRecipeMap).length, 'plants mapped to', Object.values(plantToRecipeMap).length, 'recipes');

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

  console.log(`Found ${actions.length} actions to migrate.`);

  // 4. Group actions by order and date
  const groupedActions: Record<string, any[]> = {};

  for (const action of actions) {
    const orderId = action.batch?.order?.id;
    if (!orderId) {
      console.warn(`Action ${action.id} has no associated order via batch. Skipping.`);
      continue;
    }

    const date = dayjs(action.timestamp).format('YYYY-MM-DD');
    const key = `${orderId}_${date}`;

    if (!groupedActions[key]) {
      groupedActions[key] = [];
    }
    groupedActions[key].push(action);
  }

  let migratedCount = 0;

  for (const key of Object.keys(groupedActions)) {
    try {
      const actionGroup = groupedActions[key];
      const firstAction = actionGroup[0];
      const orderId = firstAction.batch.order.id;
      const timestamp = firstAction.timestamp;

      // 5. Get order for expectedItems
      const fullOrder = await strapi.entityService.findOne('api::order.order', orderId, {
        populate: {
          plantsToGrow: {
            populate: ['plant']
          }
        }
      }) as any;

      const expectedItems = fullOrder.plantsToGrow?.map((item: any) => {
        const plantId = item.plant?.id || item.plant;
        return {
          recipe: plantToRecipeMap[plantId] || null,
          amount: item.amount,
          unit: "GRAM"
        };
      }) || [];

      const deliveredItems: any[] = [];
      for (const action of actionGroup) {
        if (action.plantBatch) {
          const plantId = action.plantBatch.plant?.id || action.plantBatch.plant;
          deliveredItems.push({
            recipe: plantToRecipeMap[plantId] || null,
            amount: action.plantBatch.amount,
            unit: 'GRAM'
          });
        }
      }

      // 6. Create Batch Delivery
      console.log(`Creating delivery for ${actionGroup.length} actions (Order: ${orderId}, Date: ${dayjs(timestamp).format('YYYY-MM-DD')})`);
      await strapi.entityService.create('api::batch-delivery.batch-delivery', {
        data: {
          deliveredAt: dayjs(timestamp).startOf('day').toISOString(),
          state: 'DELIVERED',
          order: orderId,
          expectedItems: expectedItems,
          deliveredItems: deliveredItems,
        }
      });

      migratedCount++;
    } catch (err) {
      console.error(`Failed to migrate group ${key}:`, err);
    }
  }

  console.log(`Migration finished. Created ${migratedCount} batch deliveries from ${actions.length} actions.`);
}
