export default class Response {
    success: boolean;
    message: string;
    constructor(success: boolean, message: string) {
        this.success = success;
        this.message = message;
    }

    toJson() {
        return { success: this.success, message: this.message };
    }

    toString() {
        return JSON.stringify({ success: this.success, message: this.message });
    }

    valueOf() {
        return { success: this.success, message: this.message };
    }
}