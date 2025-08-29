
export function isValidColumnName(name: string): boolean {
    return /^[a-zA-Z0-9_.]+$/.test(name);
}

export function ensureValidColumn(name: string): string {
    if (!isValidColumnName(name)) {
        throw new Error(`Invalid column name: ${name}`);
    }
    return name;
}