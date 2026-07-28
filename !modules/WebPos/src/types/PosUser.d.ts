export default class PosUser {
    getUsername(): string;
    getBalance(): number;
    setBalance(amount: number): void;
    addBalance(amount: number): void;
    subtractBalance(amount: number): boolean;
    getProducts(): any[];
    getProduct(productId: string): any | undefined;
    addProduct(product: any): void;
    updateProduct(productId: string, updates: any): boolean;
    removeProduct(productId: string): boolean;
    getCreatedAt(): number;
    toJSON(): any;
}
