import {ID} from "../../../model";
import {OrderBase} from "../../order/types/order";
import {ActionBase} from "../../action/types/action";
import {Plant} from "../../plant/types/plant";
import {GrowStrategy} from "../../grow-strategy/types/growStrategy";

export interface BatchBase {
    id: number;
    dueToDate: string;
    state: 'waiting' | 'running' | 'done';
    orderId?: ID;
}

export interface BatchPopulate {
    plantsToGrow?: {
        id: number;
        plant: Plant;
        growStrategy: GrowStrategy;
    }[];
    order?: OrderBase;
    actions?: ActionBase[];
}

export type BatchWithPlants = BatchBase & Pick<BatchPopulate, "plantsToGrow">;
export type BatchWithOrder = BatchBase & Pick<BatchPopulate, "order">;
export type BatchWithActions = BatchBase & Pick<BatchPopulate, "actions">;

export type BatchFull = BatchBase & Required<BatchPopulate>;
