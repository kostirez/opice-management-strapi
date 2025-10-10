import {OrderBase} from "../../order/types/order";

export interface CustomerBase {
    name: string;
    invoiceStaticId: number;

}

export interface CustomerPopulate {
    orders?: OrderBase[];
    deliveryAddress?: any;
    billing?: any;

}