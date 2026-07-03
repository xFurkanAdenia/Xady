/**
 * Demo Custom Event - Örnek custom event
 */
export default class DemoCustomEvent extends Xady.XadyEvent {
    private player: string;
    private action: string;
    private result: string = "";

    constructor(player: string, action: string) {
        super();
        this.player = player;
        this.action = action;
    }

    getPlayer(): string {
        return this.player;
    }

    getAction(): string {
        return this.action;
    }

    getResult(): string {
        return this.result;
    }

    setResult(result: string): void {
        this.result = result;
    }

    setAction(action: string): void {
        this.action = action;
    }
}