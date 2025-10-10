
export interface Box {
    code: string;
    used: boolean;
    place:  "stock" | "packed" | "delivering" | "customer" | "returning" | "wash";
}