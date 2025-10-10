import {ActionBase} from "../../action/types/action";
import {ID} from "../../../model";

export interface GrowStrategy {
    id: ID;
    name: string;
    actions: ActionBase[];
}