export abstract class XadyEvent {
    private eventName: string;

    constructor() {
        this.eventName = this.constructor.name;
    }

    getEventName(): string {
        return this.eventName;
    }
}
