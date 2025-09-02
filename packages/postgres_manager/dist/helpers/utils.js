"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidColumnName = isValidColumnName;
exports.ensureValidColumn = ensureValidColumn;
function isValidColumnName(name) {
    return /^[a-zA-Z0-9_.]+$/.test(name);
}
function ensureValidColumn(name) {
    if (!isValidColumnName(name)) {
        throw new Error(`Invalid column name: ${name}`);
    }
    return name;
}
