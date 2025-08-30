import { BoolList } from '../sql-schema/bool-list.js';
import { BoolValue } from '../sql-schema/bool-value.js';
import { Float64List } from '../sql-schema/float64-list.js';
import { Int64List } from '../sql-schema/int64-list.js';
import { Int64Value } from '../sql-schema/int64-value.js';
import { NullValue } from '../sql-schema/null-value.js';
import { NumberValue } from '../sql-schema/number-value.js';
import { StringList } from '../sql-schema/string-list.js';
import { StringValue } from '../sql-schema/string-value.js';
import { TimestampValue } from '../sql-schema/timestamp-value.js';
export declare enum FilterValue {
    NONE = 0,
    StringValue = 1,
    NumberValue = 2,
    BoolValue = 3,
    NullValue = 4,
    Int64Value = 5,
    TimestampValue = 6,
    StringList = 7,
    Int64List = 8,
    Float64List = 9,
    BoolList = 10
}
export declare function unionToFilterValue(type: FilterValue, accessor: (obj: BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue) => BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue | null): BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue | null;
export declare function unionListToFilterValue(type: FilterValue, accessor: (index: number, obj: BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue) => BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue | null, index: number): BoolList | BoolValue | Float64List | Int64List | Int64Value | NullValue | NumberValue | StringList | StringValue | TimestampValue | null;
//# sourceMappingURL=filter-value.d.ts.map