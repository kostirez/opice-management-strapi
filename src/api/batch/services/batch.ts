/**
 * batch service
 */

import { factories } from '@strapi/strapi';
import {
    BatchBase,
    BatchWithPlants,
} from '../types/batch';
import {ID} from "../../../model";
import {OrderWithPlantsAndDeliveryTimes} from "../../order/types/order";


export default factories.createCoreService('api::batch.batch', ({strapi}) => ({

    //// GETTERS //////

    async getBatch<T>(batchId: ID, populate: any): Promise<T | null> {
        const batches = await strapi.entityService.findMany('api::batch.batch', {
            filters: {
                id: batchId
            },
            populate: populate,
        });
        if (batches.length === 0) {
            return null;
        }
        return batches[0] as T;
    },

    async getBasicBatch(batchId: ID): Promise<BatchBase | null> {
        return this.getBatch<BatchBase>(batchId, {});
    },


    async getBatchWithPlantsToGrow(batchId: ID): Promise<BatchWithPlants> {
        return this.getBatch<BatchWithPlants>(
            batchId,
            {
                plantsToGrow: {
                    populate: {
                        growStrategy: {populate: {actions: {populate: [ 'actionType' ]}}},
                        plant: true
                    }
                }
            }
        );
    },

    //// GENERATORS //////


    /**
     * Generates a single batch for a specific order and delivery date
     * @param orderId The ID of the order to generate batch for
     * @param deliveryDate The target delivery date
     * @returns The created batch or null if conditions are not met
     */
    async generateSingleBatch(orderId: number, deliveryDate: Date): Promise<any> {
        const order = await strapi.service('api::order.order').getOrderWithPlantsAndDeliveryTimes(orderId) as OrderWithPlantsAndDeliveryTimes;

        // Type assertion after we know the data is populated
        if (!order || !order.plantsToGrow || order.plantsToGrow.length === 0) {
            return null;
        }

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
        await strapi.service('api::action.action').generateActionsForBatch(Number(batch.id));
        return batch;
    }





    // // ✅ Batch with plants
    // async getBatchWithPlants(batchId: number): Promise<BatchWithPlants | null> {
    //     const batch = await strapi.entityService.findOne('api::batch.batch', batchId, {
    //         populate: { plantsToGrow: { populate: ['plant', 'growStrategy'] } },
    //     });
    //     return batch as unknown as BatchWithPlants;
    // },
    //
    //     // ✅ Batch with order
    //     async getBatchWithOrder(batchId: number): Promise<BatchWithOrder | null> {
    //     const batch = await strapi.entityService.findOne('api::batch.batch', batchId, {
    //         populate: { order: true },
    //     });
    //     return batch as unknown as BatchWithOrder;
    // },
    //
    //     // ✅ Batch with actions
    //     async getBatchWithActions(batchId: number): Promise<BatchWithActions | null> {
    //     const batch = await strapi.entityService.findOne('api::batch.batch', batchId, {
    //         populate: { actions: true },
    //     });
    //     return batch as unknown as BatchWithActions;
    // },
    //
    //     // ✅ Fully populated batch
    //     async getFullBatch(batchId: number): Promise<BatchFull | null> {
    //     const batch = await strapi.entityService.findOne('api::batch.batch', batchId, {
    //         populate: {
    //             plantsToGrow: { populate: ['plant', 'growStrategy'] },
    //             order: true,
    //             actions: true,
    //         },
    //     });
    //     return batch as unknown as BatchFull;
    // },

    //     // 🔹 Get batch IDs by order
    //     async getBatchIdsByOrder(orderId: ID): Promise<ID[]> {
    //     const batches = await strapi.entityService.findMany('api::batch.batch', {
    //         filters: { order: orderId },
    //         fields: ['id'],
    //     });
    //     return batches.map(b => b.id);
    // },
    //
    //     // 🔹 Get batch IDs by action
    //     async getBatchIdsByAction(actionId: number): Promise<number[]> {
    //     const actions = await strapi.entityService.findMany('api::action.action', {
    //         filters: { id: actionId },
    //         populate: { batch: true },
    //     });
    //     const batchIds = actions
    //         .map(a => a.batch?.id)
    //         .filter((id): id is number => !!id);
    //     return Array.from(new Set(batchIds));
    // },

    ////// END GETTERS ////////
    /**
     * Generates a single batch for a specific order and delivery date
     * @param orderId The ID of the order to generate batch for
     * @param deliveryDate The target delivery date
     * @returns The created batch or null if conditions are not met
     */
    // generateSingleBatch: async (orderId: number, deliveryDate: string): Promise<any> =>  {
    //     const orders = await strapi.entityService.findMany('api::order.order', {
    //         filters: {
    //             id: orderId
    //         },
    //         populate: {
    //             deliveryTimes: {
    //                 populate: ['daysInWeek']
    //             },
    //             plantsToGrow: {
    //                 populate: ['plant', 'growStrategy']
    //             }
    //         }
    //     });
    //
    //     // Type assertion after we know the data is populated
    //     const order = orders[0] as unknown as Order;
    //     if (!order || !order.plantsToGrow || order.plantsToGrow.length === 0) {
    //         return null;
    //     }
    //     const data = {
    //         order: order.id,
    //         dueToDate: deliveryDate,
    //         plantsToGrow: order.plantsToGrow.map(plantToGrow => ({
    //             amount: plantToGrow.amount,
    //             plant: plantToGrow.plant.id,
    //             growStrategy: plantToGrow.growStrategy.id,
    //         })),
    //         state: new Date(deliveryDate) < new Date() ? 'done' as const : 'waiting' as const,
    //     };
    //
    //     const batch = await strapi.entityService.create('api::batch.batch', {data});
    //     await generateActionsForBatch(Number(batch.id));
    //     return batch;
    //
    //
    //     // return null;
    // }
}));
