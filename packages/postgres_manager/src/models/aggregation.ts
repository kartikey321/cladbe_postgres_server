/*
class DataHelperAggregation {
  int? count;
  Map<String, double?>? sumValues;
  Map<String, double?>? averageValues;
  DataHelperAggregation({this.count, this.sumValues, this.averageValues});
}
 */

export interface DataHelperAggregation{
    count?: number;
    sumValues?:Record<string, number>| undefined;
    avgValues?:Record<string, number> | undefined;
    minimumValues?:Record<string, number> | undefined;
    maximumValues?:Record<string, number> | undefined;
}