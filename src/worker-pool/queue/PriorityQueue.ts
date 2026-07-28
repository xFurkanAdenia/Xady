/**
 * PriorityQueue - Binary Heap implementation for O(log n) task scheduling
 * 
 * Based on max-heap data structure where parent nodes have higher priority than children.
 * Provides efficient O(log n) insertion and extraction of highest priority elements.
 */

/**
 * Comparator function for priority comparison
 */
export type PriorityComparator<T> = (a: T, b: T) => number;

/**
 * PriorityQueue implementation using Binary Heap
 */
export class PriorityQueue<T> {
    #heap: T[] = [];
    #comparator: PriorityComparator<T>;
    #size: number = 0;

    /**
     * Create a new PriorityQueue
     * 
     * @param comparator - Function that returns positive if a > b, negative if a < b, zero if equal
     */
    constructor(comparator: PriorityComparator<T>) {
        this.#comparator = comparator;
    }

    /**
     * Insert an element into the queue
     * Time complexity: O(log n)
     * 
     * @param item - Element to insert
     */
    public enqueue(item: T): void {
        this.#heap.push(item);
        this.#size++;
        this.#bubbleUp(this.#size - 1);
    }

    /**
     * Remove and return the highest priority element
     * Time complexity: O(log n)
     * 
     * @returns The highest priority element, or undefined if queue is empty
     */
    public dequeue(): T | undefined {
        if (this.#size === 0) {
            return undefined;
        }

        if (this.#size === 1) {
            this.#size--;
            return this.#heap.pop();
        }

        const top = this.#heap[0];
        this.#heap[0] = this.#heap.pop()!;
        this.#size--;
        this.#bubbleDown(0);

        return top;
    }

    /**
     * View the highest priority element without removing it
     * Time complexity: O(1)
     * 
     * @returns The highest priority element, or undefined if queue is empty
     */
    public peek(): T | undefined {
        return this.#size > 0 ? this.#heap[0] : undefined;
    }

    /**
     * Remove a specific item from the queue
     * Time complexity: O(n) for search + O(log n) for removal
     * 
     * @param item - Item to remove
     * @returns true if item was found and removed, false otherwise
     */
    public remove(item: T): boolean {
        const index = this.#heap.indexOf(item);
        if (index === -1) {
            return false;
        }

        return this.removeAt(index);
    }

    /**
     * Remove item at specific index
     * Time complexity: O(log n)
     * 
     * @param index - Index of item to remove
     * @returns true if removed successfully
     */
    public removeAt(index: number): boolean {
        if (index < 0 || index >= this.#size) {
            return false;
        }

        if (index === this.#size - 1) {
            this.#heap.pop();
            this.#size--;
            return true;
        }

        this.#heap[index] = this.#heap.pop()!;
        this.#size--;

        const parent = this.#parent(index);
        if (index > 0 && this.#compare(index, parent) > 0) {
            this.#bubbleUp(index);
        } else {
            this.#bubbleDown(index);
        }

        return true;
    }

    /**
     * Find index of an item
     * Time complexity: O(n)
     * 
     * @param predicate - Function to test each element
     * @returns Index of first matching element, or -1 if not found
     */
    public findIndex(predicate: (item: T) => boolean): number {
        return this.#heap.findIndex(predicate);
    }

    /**
     * Check if queue contains an item
     * Time complexity: O(n)
     * 
     * @param item - Item to search for
     * @returns true if item exists in queue
     */
    public contains(item: T): boolean {
        return this.#heap.includes(item);
    }

    /**
     * Get the number of elements in the queue
     * Time complexity: O(1)
     */
    public get size(): number {
        return this.#size;
    }

    /**
     * Check if the queue is empty
     * Time complexity: O(1)
     */
    public isEmpty(): boolean {
        return this.#size === 0;
    }

    /**
     * Clear all elements from the queue
     * Time complexity: O(1)
     */
    public clear(): void {
        this.#heap = [];
        this.#size = 0;
    }

    /**
     * Get all elements as an array (not sorted)
     * Time complexity: O(n)
     */
    public toArray(): T[] {
        return this.#heap.slice(0, this.#size);
    }

    /**
     * Get all elements sorted by priority (highest first)
     * Time complexity: O(n log n)
     */
    public toSortedArray(): T[] {
        const copy = new PriorityQueue(this.#comparator);
        copy.#heap = [...this.#heap.slice(0, this.#size)];
        copy.#size = this.#size;

        const sorted: T[] = [];
        while (!copy.isEmpty()) {
            sorted.push(copy.dequeue()!);
        }

        return sorted;
    }

    /**
     * Validate heap invariant (for debugging)
     * Time complexity: O(n)
     * 
     * @returns true if heap property is maintained
     */
    public validateHeap(): boolean {
        for (let i = 0; i < this.#size; i++) {
            const left = this.#leftChild(i);
            const right = this.#rightChild(i);

            if (left < this.#size && this.#compare(left, i) > 0) {
                return false;
            }

            if (right < this.#size && this.#compare(right, i) > 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Bubble up element at index to maintain heap property
     * Time complexity: O(log n)
     */
    #bubbleUp(index: number): void {
        while (index > 0) {
            const parent = this.#parent(index);
            if (this.#compare(index, parent) <= 0) {
                break;
            }

            this.#swap(index, parent);
            index = parent;
        }
    }

    /**
     * Bubble down element at index to maintain heap property
     * Time complexity: O(log n)
     */
    #bubbleDown(index: number): void {
        while (true) {
            const left = this.#leftChild(index);
            const right = this.#rightChild(index);
            let largest = index;

            if (left < this.#size && this.#compare(left, largest) > 0) {
                largest = left;
            }

            if (right < this.#size && this.#compare(right, largest) > 0) {
                largest = right;
            }

            if (largest === index) {
                break;
            }

            this.#swap(index, largest);
            index = largest;
        }
    }

    /**
     * Compare two elements by their indices
     */
    #compare(i: number, j: number): number {
        return this.#comparator(this.#heap[i], this.#heap[j]);
    }

    /**
     * Swap two elements in the heap
     */
    #swap(i: number, j: number): void {
        const temp = this.#heap[i];
        this.#heap[i] = this.#heap[j];
        this.#heap[j] = temp;
    }

    /**
     * Get parent index
     */
    #parent(index: number): number {
        return Math.floor((index - 1) / 2);
    }

    /**
     * Get left child index
     */
    #leftChild(index: number): number {
        return 2 * index + 1;
    }

    /**
     * Get right child index
     */
    #rightChild(index: number): number {
        return 2 * index + 2;
    }

    /**
     * Iterator support
     */
    public *[Symbol.iterator](): Iterator<T> {
        for (let i = 0; i < this.#size; i++) {
            yield this.#heap[i];
        }
    }

    /**
     * For debugging - get heap structure
     */
    public getHeapStructure(): string {
        const lines: string[] = [];
        const maxDepth = Math.floor(Math.log2(this.#size)) + 1;

        for (let depth = 0; depth < maxDepth; depth++) {
            const start = (1 << depth) - 1;
            const end = Math.min((1 << (depth + 1)) - 1, this.#size);
            const level: string[] = [];

            for (let i = start; i < end; i++) {
                level.push(String(this.#heap[i]));
            }

            lines.push(`Level ${depth}: ${level.join(' ')}`);
        }

        return lines.join('\n');
    }
}

/**
 * Create a priority queue with a simple numeric comparator (higher = higher priority)
 */
export function createNumericPriorityQueue<T>(
    getPriority: (item: T) => number
): PriorityQueue<T> {
    return new PriorityQueue<T>((a, b) => getPriority(a) - getPriority(b));
}

/**
 * Create a priority queue with reverse numeric comparator (lower = higher priority)
 */
export function createReversePriorityQueue<T>(
    getPriority: (item: T) => number
): PriorityQueue<T> {
    return new PriorityQueue<T>((a, b) => getPriority(b) - getPriority(a));
}
