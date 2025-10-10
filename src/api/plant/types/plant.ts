import {ID} from "../../../model";

export interface Plant {
    id: ID
    code: string;
    name: string;
    typeName: string;
    timeToGrow: number;
}