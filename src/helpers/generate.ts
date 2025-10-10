// Types for our entities
interface Plant {
  id: number;
  timeToGrow: number;
}

interface GrowStrategy {
  id: number;
  actions: Array<{
    daysBeforeHarvest: number;
    actionType: {
      id: number;
    };
  }>;
}

interface PlantToGrow {
  amount: number;
  plant: Plant;
  growStrategy: GrowStrategy;
}

interface DayInWeek {
  day: string;
}

interface DeliveryTimes {
  preferTimeOfDelivery: string;
  until: string;
  daysInWeek: DayInWeek[];
}

interface Order {
  id: number;
  firstDelivery: string;
  plantsToGrow: PlantToGrow[];
  deliveryTimes: DeliveryTimes;
}

/**
 * Generates a single batch for a specific order and delivery date
 * @param orderId The ID of the order to generate batch for
 * @param deliveryDate The target delivery date
 * @returns The created batch or null if conditions are not met
 */
export async function generateSingleBatch(orderId: number, deliveryDate: Date): Promise<any> {
    const orders = await strapi.entityService.findMany('api::order.order', {
        filters: {
            id: orderId
        },
        populate: {
            deliveryTimes: {
                populate: ['daysInWeek']
            },
            plantsToGrow: {
                populate: ['plant', 'growStrategy']
            }
        }
    });

    // Type assertion after we know the data is populated
    const order = orders[0] as unknown as Order;
    if (!order || !order.plantsToGrow || order.plantsToGrow.length === 0) {
        return null;
    }

    // const firstDelivery = new Date(order.firstDelivery.toString());
    // const lastDelivery = new Date(order.deliveryTimes.until.toString());
    // lastDelivery.setHours(23);

    // Get days in week when should be order delivered
    // const orderDays = order.deliveryTimes.daysInWeek.map(d => d.day);
    // const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    // // Check if delivery date is valid
    // if (deliveryDate >= firstDelivery &&
    //     orderDays.includes(days[deliveryDate.getDay()]) &&
    //     deliveryDate <= lastDelivery) {
    //
    const data = {
        order: order.id,
        dueToDate: deliveryDate,
        plantsToGrow: order.plantsToGrow.map(plantToGrow => ({
            amount: plantToGrow.amount,
            plant: plantToGrow.plant.id,
            growStrategy: plantToGrow.growStrategy.id,
        })),
        state: new Date(deliveryDate) < new Date() ? 'done' as const : 'waiting' as const,
    };

    const batch = await strapi.entityService.create('api::batch.batch', {data});
    await generateActionsForBatch(Number(batch.id));
    return batch;


    // return null;
}

/**
 * Generates multiple batches for a specific order on given dates
 * @param orderId The ID of the order to generate batches for
 * @param dates Array of dates to generate batches for
 * @returns Array of created batches
 */
export async function generateBatchesForDates(orderId: number, dates: string[]): Promise<any[]> {
  const batches = [];
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    const batch = await generateSingleBatch(orderId, date);
    if (batch) {
      batches.push(batch);
    }
  }
  
  return batches;
}


/**
 * Generates batches for a specific order within a date range
 * @param orderId The ID of the order to generate batches for
 * @param startDate Start date for batch generation
 * @param endDate End date for batch generation
 * @returns Array of created batches
 */
export async function generateBatchesForOrder(orderId: number, startDate: Date, endDate: Date): Promise<any[]> {
  const batches = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const batch = await generateSingleBatch(orderId, currentDate);
    if (batch) {
      batches.push(batch);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return batches;
}

/**
 * Generates batches for all active orders
 * @returns Array of created batches
 */
export async function generateBatch(): Promise<any[]> {
  const orders = await strapi.entityService.findMany('api::order.order', {
    where: {
      active: true
    },
    populate: {
      deliveryTimes: {
        populate: ['daysInWeek']
      },
      plantsToGrow: {
        populate: ['plant', 'growStrategy']
      }
    },
    distinct: true,
  });

  const allBatches = [];
  const today = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  for (const order of orders) {
    const batches = await generateBatchesForOrder(Number(order.id), today, oneMonthFromNow);
    allBatches.push(...batches);
  }

  return allBatches;
}

export async function generateActionsForBatch(id: number): Promise<void> {
  console.log(`Generating ${id} batch`);
  const batch = await strapi.entityService.findOne('api::batch.batch', id, {
    populate: {
      plantsToGrow: {
        populate: {
          growStrategy: {
            populate: {
              actions: {
                populate: [ 'actionType' ]
              }
            }
          },
          plant: true
        }
      }
    },
  });

  // @ts-ignore
  const plantsToGrow = batch.plantsToGrow;
  for (const plantToGrow of plantsToGrow) {
    const actions = plantToGrow.growStrategy.actions
    for (let action of actions) {
      const timeToExecute = new Date(batch.dueToDate);
      const deliveryTime = 8
      timeToExecute.setTime(timeToExecute.getTime() - getMilliseconds(action.daysBeforeHarvest) + (8 * 60 * 60 *1000));
      const newAction = await strapi.entityService
          .create('api::action.action', {
            data: {
              batch: batch.id,
              state: timeToExecute < new Date() ? 'done' as const : 'waiting' as const,
              timestamp: timeToExecute,
              plantBatch: {
                plant: plantToGrow.plant.id,
                amount: plantToGrow.amount,
                growStrategy: plantToGrow.growStrategy.id,
              },
              action_type: action.actionType.id,
            }
          });
    }
  }
}

const getMilliseconds = (num: number): number => {
  return num * 24 * 60 * 60 * 1000;
}
