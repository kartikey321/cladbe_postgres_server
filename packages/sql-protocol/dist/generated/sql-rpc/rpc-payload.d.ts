import { AddSingleReq } from '../sql-rpc/add-single-req.js';
import { CreateTableReq } from '../sql-rpc/create-table-req.js';
import { DeleteRowReq } from '../sql-rpc/delete-row-req.js';
import { GetDataReq } from '../sql-rpc/get-data-req.js';
import { GetSingleReq } from '../sql-rpc/get-single-req.js';
import { RunAggregationReq } from '../sql-rpc/run-aggregation-req.js';
import { TableExistsReq } from '../sql-rpc/table-exists-req.js';
import { UpdateSingleReq } from '../sql-rpc/update-single-req.js';
export declare enum RpcPayload {
    NONE = 0,
    GetDataReq = 1,
    GetSingleReq = 2,
    AddSingleReq = 3,
    UpdateSingleReq = 4,
    DeleteRowReq = 5,
    CreateTableReq = 6,
    TableExistsReq = 7,
    RunAggregationReq = 8
}
export declare function unionToRpcPayload(type: RpcPayload, accessor: (obj: AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq) => AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq | null): AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq | null;
export declare function unionListToRpcPayload(type: RpcPayload, accessor: (index: number, obj: AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq) => AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq | null, index: number): AddSingleReq | CreateTableReq | DeleteRowReq | GetDataReq | GetSingleReq | RunAggregationReq | TableExistsReq | UpdateSingleReq | null;
//# sourceMappingURL=rpc-payload.d.ts.map