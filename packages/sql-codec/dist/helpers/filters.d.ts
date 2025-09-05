import * as flatbuffers from "flatbuffers";
import { BaseSqlDataFilter, SqlDataFilterWrapper } from "../types.js";
export declare function isWrapper(f: BaseSqlDataFilter): f is SqlDataFilterWrapper;
export declare function encodeWrapper(b: flatbuffers.Builder, w: SqlDataFilterWrapper): number;
