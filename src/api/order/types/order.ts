// import {BatchBase} from "../../batch/types/batch";
import {Plant} from "../../plant/types/plant";

export interface OrderBase {
    id: number;
    active: boolean;
    firstDelivery: string;
    customerId?: number;
    priceListId?: number;
}

export interface OrderPopulate {
    plantsToGrow?: {
        id: number;
        plant: Plant;
        growStrategy: any;
        amount: number;
    }[];
    deliveryTimes?: {
        id: number;
        daysInWeek: string[];
    };
    customer?: {
        id: number;
        name: string;
        email: string;
    };
}

export type OrderWithCustomer = OrderBase & Pick<OrderPopulate, "customer">;
export type OrderWithDeliveryTimes = OrderBase & Pick<OrderPopulate, "deliveryTimes">;
export type OrderWithPlants = OrderBase & Pick<OrderPopulate, "plantsToGrow">;
export type OrderWithPlantsAndDeliveryTimes = OrderBase & Pick<OrderPopulate, "plantsToGrow" | "deliveryTimes">;

export type OrderFull = OrderBase & Required<OrderPopulate>;


