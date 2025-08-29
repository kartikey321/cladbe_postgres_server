export function orderSortTokenFromOrdinal(ord) {
    switch (ord) {
        case 0: return "ASC_DEFAULT";
        case 1: return "ASC_NULLS_FIRST";
        case 2: return "ASC_NULLS_LAST";
        case 3: return "DESC_DEFAULT";
        case 4: return "DESC_NULLS_FIRST";
        case 5: return "DESC_NULLS_LAST";
        default: return "DESC_DEFAULT";
    }
}
