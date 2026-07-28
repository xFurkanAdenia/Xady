export interface PosUserData {
    username: string;
    balance: number;
    products: PosProduct[];
    createdAt: number;
    updatedAt: number;
}
export interface PosProductAction {
    id: string;
    type: "command" | "function";
    value: string;
}
export interface PosProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    actions: PosProductAction[];
    enabled: boolean;
}
export default class PosUser {
    #private;
    constructor(data: PosUserData);
    getUsername(): string;
    getBalance(): number;
    getProducts(): PosProduct[];
    getCreatedAt(): number;
    getUpdatedAt(): number;
    setBalance(balance: number): void;
    addBalance(amount: number): void;
    subtractBalance(amount: number): boolean;
    addProduct(product: PosProduct): void;
    removeProduct(productId: string): boolean;
    updateProduct(productId: string, updates: Partial<PosProduct>): boolean;
    getProduct(productId: string): PosProduct | undefined;
    toJSON(): PosUserData;
}
