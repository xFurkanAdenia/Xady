type Asset = {
    contentType: string;
    body: Buffer;
};
export declare class AssetStore {
    #private;
    constructor();
    private loadFromRoots;
    get(name: string): Promise<Asset | null>;
}
export {};
