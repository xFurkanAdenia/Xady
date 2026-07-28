export interface PosFunctionData {
    id: string;
    name: string;
    description: string;
    module: string;
    handler: (context: PosFunctionContext) => void | Promise<void>;
    permissions: string[];
}
export interface PosFunctionContext {
    username: string;
    playerUsername: string;
    amount: number;
    productId?: string;
    bot?: any;
}
export default class PosFunction {
    #private;
    constructor(data: PosFunctionData);
    getId(): string;
    getName(): string;
    getDescription(): string;
    getModule(): string;
    getHandler(): (context: PosFunctionContext) => void | Promise<void>;
    getPermissions(): string[];
    execute(context: PosFunctionContext): Promise<void>;
    toJSON(): Omit<PosFunctionData, 'handler'>;
}
