// PosFunction model - Modüllerin kaydettiği fonksiyonlar

export interface PosFunctionData {
    id: string;
    name: string;
    description: string;
    module: string;
    handler: (context: PosFunctionContext) => void | Promise<void>;
    permissions: string[];
}

export interface PosFunctionContext {
    username: string; // WebPanel kullanıcısı
    playerUsername: string; // Minecraft oyuncu adı
    amount: number; // Ödeme tutarı
    productId?: string; // Ürün ID (eğer ürün üzerinden tetiklendiyse)
    bot?: any; // Minecraft bot instance
}

export default class PosFunction {
    #data: PosFunctionData;

    constructor(data: PosFunctionData) {
        this.#data = data;
    }

    getId() { return this.#data.id; }
    getName() { return this.#data.name; }
    getDescription() { return this.#data.description; }
    getModule() { return this.#data.module; }
    getHandler() { return this.#data.handler; }
    getPermissions() { return this.#data.permissions; }

    async execute(context: PosFunctionContext): Promise<void> {
        return await this.#data.handler(context);
    }

    toJSON(): Omit<PosFunctionData, 'handler'> {
        return {
            id: this.#data.id,
            name: this.#data.name,
            description: this.#data.description,
            module: this.#data.module,
            permissions: this.#data.permissions,
        };
    }
}
