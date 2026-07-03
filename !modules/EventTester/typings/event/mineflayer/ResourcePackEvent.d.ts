import { XadyEvent } from "../XadyEvent";
export declare class ResourcePackEvent extends XadyEvent {
    private url;
    private hash;
    private uuid;
    constructor(url: string, hash: string, uuid: string);
    getUrl(): string;
    getHash(): string;
    getUuid(): string;
}
