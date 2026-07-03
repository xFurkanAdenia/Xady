// PosUser model - Kullanıcı bakiye ve ürün bilgileri

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
    value: string; // command: "/give {player} diamond 1" veya functionId
}

export interface PosProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    actions: PosProductAction[]; // Birden fazla komut/fonksiyon
    enabled: boolean;
}

export default class PosUser {
    #data: PosUserData;

    constructor(data: PosUserData) {
        this.#data = data;
    }

    getUsername() { return this.#data.username; }
    getBalance() { return this.#data.balance; }
    getProducts() { return this.#data.products; }
    getCreatedAt() { return this.#data.createdAt; }
    getUpdatedAt() { return this.#data.updatedAt; }

    setBalance(balance: number) {
        this.#data.balance = balance;
        this.#data.updatedAt = Date.now();
    }

    addBalance(amount: number) {
        this.#data.balance += amount;
        this.#data.updatedAt = Date.now();
    }

    subtractBalance(amount: number): boolean {
        if (this.#data.balance < amount) return false;
        this.#data.balance -= amount;
        this.#data.updatedAt = Date.now();
        return true;
    }

    addProduct(product: PosProduct) {
        this.#data.products.push(product);
        this.#data.updatedAt = Date.now();
    }

    removeProduct(productId: string): boolean {
        const index = this.#data.products.findIndex(p => p.id === productId);
        if (index === -1) return false;
        this.#data.products.splice(index, 1);
        this.#data.updatedAt = Date.now();
        return true;
    }

    updateProduct(productId: string, updates: Partial<PosProduct>): boolean {
        const product = this.#data.products.find(p => p.id === productId);
        if (!product) return false;
        Object.assign(product, updates);
        this.#data.updatedAt = Date.now();
        return true;
    }

    getProduct(productId: string): PosProduct | undefined {
        return this.#data.products.find(p => p.id === productId);
    }

    toJSON(): PosUserData {
        return { ...this.#data };
    }
}
