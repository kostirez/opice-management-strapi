/**
 * the function generate new batches for all orders
 * @return {number} id of created batch
 */
export async function generateBatch(strapi): Promise<void> {

  const orders = await strapi.entityService.findMany('api::order.order', { // uid syntax: 'api::api-name.content-type-name'
    where: {
      active: true
    },
    populate: {
      deliveryTimes: {
        populate: [ 'daysInWeek' ]
      },
      plantsToGrow: {
        populate: [ 'plant', 'growStrategy' ]
      }
    },
    distinct: true,
  });

  for (const order of orders) {
    if (!order.plantsToGrow || order.plantsToGrow.length === 0) {
      continue;
    }
    const today = new Date();
    // get batch ready date
    const maxTimeToGrow = Math.max(...order.plantsToGrow.map(p => p.plant.timeToGrow));
    const batchReadyDate = new Date();
    const timeGap = 3;
    batchReadyDate.setTime(today.getTime() + getMilliseconds(maxTimeToGrow) + getMilliseconds(timeGap));

    //set preferable time of delivery
    let tempTime = order.deliveryTimes.preferTimeOfDelivery.split(":");
    batchReadyDate.setHours(tempTime[0]);
    batchReadyDate.setMinutes(tempTime[1]);
    batchReadyDate.setSeconds(tempTime[2]);

    // get fist and last delivery
    const firstDelivery = new Date(order.firstDelivery.toString())
    const lastDelivery = new Date(order.deliveryTimes.until.toString())
    lastDelivery.setHours(23);

    // get days in week when should be order delivered
    const orderDays = order.deliveryTimes.daysInWeek.map(d => d.day);
    const days = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];

    // readyDate has to be in between of first and last delivery and match day in week
    if (batchReadyDate >= firstDelivery && orderDays.includes(days[batchReadyDate.getDay()]) && batchReadyDate <= lastDelivery) {
      const data = {
        order: order.id,
        dueToDate: batchReadyDate,
        plantsToGrow: order.plantsToGrow
            .map(plantToGrow => {
              // console.log("p", plantToGrow);
              return {

                amount: plantToGrow.amount,
                plant: {connect: [ {id: plantToGrow.plant.id} ]},
                growStrategy: {connect: [ {id: plantToGrow.growStrategy.id} ]},
              }
            }),
        state: 'waiting',
      }

      const batch = await strapi.entityService.create('api::batch.batch', {data});
      await generateActionsForBatch(Number(batch.id));
    }
  }
}

export async function generateActionsForBatch(id: number): Promise<void> {

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
      timeToExecute.setTime(timeToExecute.getTime() - getMilliseconds(action.daysBeforeHarvest));
      const newAction = await strapi.entityService
          .create('api::action.action', {
            data: {
              batch: batch.id,
              state: 'waiting',
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
