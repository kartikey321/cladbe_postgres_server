import * as flatbuffers from "flatbuffers";
/** JSON value -> (FilterValue.type, offset) */
export declare function encodeFilterValue(b: flatbuffers.Builder, v: unknown): {
    type: number;
    off: number;
};
/** FB FilterValue -> JSON value */
export declare function decodeFilterValue(valType: number, get: <T>(o: T) => T | null): unknown;
