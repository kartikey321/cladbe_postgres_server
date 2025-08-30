import { AggRes } from '../sql-rpc/agg-res.js';
import { BoolRes } from '../sql-rpc/bool-res.js';
import { RowJson } from '../sql-rpc/row-json.js';
import { RowsJson } from '../sql-rpc/rows-json.js';
export declare enum RpcResponse {
    NONE = 0,
    RowsJson = 1,
    RowJson = 2,
    BoolRes = 3,
    AggRes = 4
}
export declare function unionToRpcResponse(type: RpcResponse, accessor: (obj: AggRes | BoolRes | RowJson | RowsJson) => AggRes | BoolRes | RowJson | RowsJson | null): AggRes | BoolRes | RowJson | RowsJson | null;
export declare function unionListToRpcResponse(type: RpcResponse, accessor: (index: number, obj: AggRes | BoolRes | RowJson | RowsJson) => AggRes | BoolRes | RowJson | RowsJson | null, index: number): AggRes | BoolRes | RowJson | RowsJson | null;
//# sourceMappingURL=rpc-response.d.ts.map