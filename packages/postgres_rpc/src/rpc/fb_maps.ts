// packages/postgres_rpc/src/rpc/fb_maps.ts
export type OrderSortToken =
    | "ASC_DEFAULT" | "ASC_NULLS_FIRST" | "ASC_NULLS_LAST"
    | "DESC_DEFAULT" | "DESC_NULLS_FIRST" | "DESC_NULLS_LAST";

export type OrderSortOrdinal = 0 | 1 | 2 | 3 | 4 | 5;

export function orderSortTokenFromOrdinal(ord: number): OrderSortToken {
    switch (ord as OrderSortOrdinal) {
        case 0: return "ASC_DEFAULT";
        case 1: return "ASC_NULLS_FIRST";
        case 2: return "ASC_NULLS_LAST";
        case 3: return "DESC_DEFAULT";
        case 4: return "DESC_NULLS_FIRST";
        case 5: return "DESC_NULLS_LAST";
        default: return "DESC_DEFAULT";
    }
}
