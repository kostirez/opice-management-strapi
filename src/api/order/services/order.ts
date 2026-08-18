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

    async getDeliveryList(date: string) {
console.log('date', date)
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
        }

        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayOfWeek = days[targetDate.getDay()];

        const orders = await strapi.entityService.findMany('api::order.order', {
            filters: {
                active: true,
                deliveryTimes: {
                    daysInWeek: {
                        day: dayOfWeek as any
                    }
                }
            },
            populate: {
                customer: true,
                itemsForDelivery: {
                    populate: ['recipe']
                },
                deliveryTimes: {
                    populate: ['daysInWeek']
                }
            }
        });

        return orders.map((order: any) => ({
            customerName: order.customer?.name || order.customer?.officialName,
            orderId: order.id,
            itemsForDelivery: (order.itemsForDelivery || []).map((item: any) => ({
                recipeId: item.recipe?.id,
                recipeName: item.recipe?.name,
                amount: item.amount,
                unit: item.unit
            }))
        }));
    },

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
