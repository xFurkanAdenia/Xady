export default class Response {
    readonly #success: boolean;
    readonly #message: string;
    
    constructor(success: boolean, message: string) {
        this.#success = success;
        this.#message = message;
    }

    public get success(): boolean {
        return this.#success;
    }

    public get message(): string {
        return this.#message;
    }

    public toJson(): { success: boolean; message: string } {
        return { success: this.#success, message: this.#message };
    }

    public toString(): string {
        return JSON.stringify(this.toJson());
    }

    public valueOf(): { success: boolean; message: string } {
        return this.toJson();
    }
}