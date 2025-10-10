/**
 * order service
 */

import { factories } from '@strapi/strapi';
import {
    OrderBase, OrderFull, OrderWithCustomer, OrderWithDeliveryTimes, OrderWithPlants,
    OrderWithPlantsAndDeliveryTimes
} from "../types/order";
import {ID} from "../../../model";

export default factories.createCoreService('api::order.order',  ({strapi}) => ({

    async getOrder<T>(orderId: ID, populate: any): Promise<T | null> {
        const orders = await strapi.entityService.findMany('api::order.order', {
            filters: {
                id: orderId
            },
            populate: populate,
        });
        if (orders.length === 0) {
            return null;
        }
        return orders[0] as T;
    },

    // ✅ Basic order
    async getBasicOrder(orderId: ID): Promise<OrderBase | null> {
        return this.getOrder<OrderBase>(orderId, {});
    },

    async getOrderWithPlantsAndDeliveryTimes(orderId: ID): Promise<OrderWithPlantsAndDeliveryTimes | null> {
        return await this.getOrder<OrderBase>(
            orderId,
            {
                deliveryTimes: { populate: ['daysInWeek'] },
                plantsToGrow: { populate: ['plant', 'growStrategy'] },
            }
        );
    },
}));
