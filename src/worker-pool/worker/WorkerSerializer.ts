/**
 * WorkerSerializer - Validates data can be serialized for worker communication
 */

import { SerializationException } from '../exceptions';

/**
 * WorkerSerializer validates structured clone compatibility
 */
export class WorkerSerializer {
    /**
     * Validate that data can be sent to a worker
     * 
     * @param data - Data to validate
     * @param path - Current path for error reporting
     * @throws SerializationException if data contains non-transferable types
     */
    public static validate(data: any, path: string = 'root'): void {
        const visited = new WeakSet<object>();
        this.validateRecursive(data, path, visited);
    }

    /**
     * Check if data is serializable (returns boolean instead of throwing)
     */
    public static isSerializable(data: any): boolean {
        try {
            this.validate(data);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Recursive validation
     */
    private static validateRecursive(data: any, path: string, visited: WeakSet<object>): void {
        if (data === null || data === undefined) {
            return;
        }

        const type = typeof data;

        if (type === 'function') {
            throw new SerializationException(path, 'Function', data, 
                'Functions cannot be transferred to workers. Use TaskRegistry to register functions by name.');
        }

        if (type === 'symbol') {
            throw new SerializationException(path, 'Symbol', data,
                'Symbols cannot be transferred to workers.');
        }

        if (type !== 'object') {
            return;
        }

        if (visited.has(data)) {
            throw new SerializationException(path, 'Circular Reference', data,
                'Circular references cannot be transferred to workers.');
        }

        if (data instanceof WeakMap) {
            throw new SerializationException(path, 'WeakMap', data,
                'WeakMap cannot be transferred to workers. Use Map instead.');
        }

        if (data instanceof WeakSet) {
            throw new SerializationException(path, 'WeakSet', data,
                'WeakSet cannot be transferred to workers. Use Set instead.');
        }

        if (typeof Proxy !== 'undefined' && this.isProxy(data)) {
            throw new SerializationException(path, 'Proxy', data,
                'Proxy objects cannot be transferred to workers.');
        }

        if (this.isTransferable(data)) {
            return;
        }

        visited.add(data);

        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                this.validateRecursive(data[i], `${path}[${i}]`, visited);
            }
        } else if (data.constructor === Object || Object.getPrototypeOf(data) === Object.prototype) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    this.validateRecursive(data[key], `${path}.${key}`, visited);
                }
            }
        } else if (data instanceof Map) {
            let index = 0;
            for (const [key, value] of data.entries()) {
                this.validateRecursive(key, `${path}.keys[${index}]`, visited);
                this.validateRecursive(value, `${path}.values[${index}]`, visited);
                index++;
            }
        } else if (data instanceof Set) {
            let index = 0;
            for (const value of data.values()) {
                this.validateRecursive(value, `${path}[${index}]`, visited);
                index++;
            }
        }

        visited.delete(data);
    }

    /**
     * Check if object is a Proxy (best effort)
     */
    private static isProxy(obj: any): boolean {
        try {
            return obj[Symbol.toStringTag] === 'Proxy';
        } catch {
            return false;
        }
    }

    /**
     * Check if data is a transferable type
     */
    private static isTransferable(data: any): boolean {
        return (
            data instanceof Buffer ||
            data instanceof ArrayBuffer ||
            data instanceof SharedArrayBuffer ||
            ArrayBuffer.isView(data) ||
            data instanceof Date ||
            data instanceof RegExp ||
            data instanceof Error ||
            data instanceof Map ||
            data instanceof Set ||
            (typeof MessagePort !== 'undefined' && data instanceof MessagePort)
        );
    }

    /**
     * Get list of unsupported types in data
     */
    public static getUnsupportedTypes(data: any): string[] {
        const unsupported: string[] = [];
        const visited = new WeakSet<object>();

        const check = (value: any, path: string): void => {
            if (value === null || value === undefined) return;

            const type = typeof value;

            if (type === 'function') {
                unsupported.push(`Function at ${path}`);
                return;
            }

            if (type === 'symbol') {
                unsupported.push(`Symbol at ${path}`);
                return;
            }

            if (type !== 'object') return;

            if (visited.has(value)) {
                unsupported.push(`Circular reference at ${path}`);
                return;
            }

            if (value instanceof WeakMap) {
                unsupported.push(`WeakMap at ${path}`);
                return;
            }

            if (value instanceof WeakSet) {
                unsupported.push(`WeakSet at ${path}`);
                return;
            }

            if (this.isTransferable(value)) {
                return;
            }

            visited.add(value);

            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    check(value[i], `${path}[${i}]`);
                }
            } else if (value.constructor === Object) {
                for (const key in value) {
                    if (value.hasOwnProperty(key)) {
                        check(value[key], `${path}.${key}`);
                    }
                }
            }

            visited.delete(value);
        };

        check(data, 'root');
        return unsupported;
    }
}
