import {BatchBase, BatchPopulate} from "../../batch/types/batch";
import {Tray} from "../../tray/types/tray";
import {Plant} from "../../plant/types/plant";


export interface TrayBatchBase {
    expectedGain: number;
    realGain: number;
}

export interface TrayBatchPopulate {
    trays: Tray[];
    plant: Plant;
};

export type TrayBatchWithPlant = TrayBatchBase & Pick<TrayBatchPopulate, "plant">;
export type TrayBatchWithTrays = TrayBatchBase & Pick<TrayBatchPopulate, "trays">;

export type TrayBatchFull = TrayBatchBase & Required<TrayBatchPopulate>;