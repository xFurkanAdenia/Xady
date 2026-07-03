import { XadyEvent } from "../XadyEvent";

export class ResourcePackEvent extends XadyEvent {
    private url: string;
    private hash: string;
    private uuid: string;

    constructor(url: string, hash: string, uuid: string) {
        super();
        this.url = url;
        this.hash = hash;
        this.uuid = uuid;
    }

    getUrl(): string {
        return this.url;
    }

    getHash(): string {
        return this.hash;
    }

    getUuid(): string {
        return this.uuid;
    }
}
