import {ID} from "../../../model";
import {ActionType} from "../../action-type/content-types/action-type/model";
import {BatchBase} from "../../batch/types/batch";
import {TrayBatchBase} from "../../tray-batch/types/trayBatch";
import {BoxBatch} from "../../box-batch/types/boxBatch";
import {Plant} from "../../plant/types/plant";
import {GrowStrategy} from "../../grow-strategy/types/growStrategy";

export type ActionState  = "waiting" | "running" | "done";

export interface ActionBase {
    batchId: ID;
    state: ActionState;
    timestamp: string;
    timeSpent: number;
    plantBatch: any;
    actionType: ActionType;
}

export interface ActionPopulate {
    batch?: BatchBase;
    plantBatch?:  {
        plant: Plant,
        amount: number;
        growStrategy: GrowStrategy;
    };
    trayBatches?: TrayBatchBase[];
    box_batches?: BoxBatch[];
}

export type ActionWithBatch = ActionBase & Pick<ActionPopulate, "batch">;
export type ActionWithPlantBatch = ActionBase & Pick<ActionPopulate, "plantBatch">;

export type ActionFull = ActionBase & Required<ActionPopulate>;