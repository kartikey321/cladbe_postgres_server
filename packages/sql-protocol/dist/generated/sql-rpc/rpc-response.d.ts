import { AggRes } from '../sql-rpc/agg-res.js';
import { BoolRes } from '../sql-rpc/bool-res.js';
import { RowJson } from '../sql-rpc/row-json.js';
import { RowsJson } from '../sql-rpc/rows-json.js';
import { RowsWithCursor } from '../sql-rpc/rows-with-cursor.js';
export declare enum RpcResponse {
    NONE = 0,
    RowsJson = 1,
    RowJson = 2,
    BoolRes = 3,
    AggRes = 4,
    RowsWithCursor = 5
}
export declare function unionToRpcResponse(type: RpcResponse, accessor: (obj: AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor) => AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor | null): AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor | null;
export declare function unionListToRpcResponse(type: RpcResponse, accessor: (index: number, obj: AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor) => AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor | null, index: number): AggRes | BoolRes | RowJson | RowsJson | RowsWithCursor | null;
//# sourceMappingURL=rpc-response.d.ts.map