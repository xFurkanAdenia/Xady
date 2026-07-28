export function isJson(obj: unknown): obj is string {
    if (typeof obj !== 'string') return false;
    try {
        JSON.parse(obj);
        return true;
    } 
    catch {
        return false;
    }
}

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isArray<T = unknown>(value: unknown): value is T[] {
    return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
}